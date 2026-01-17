import {
  useState,
  useEffect,
  useMemo,
  useRef,
  // Children,
  // isValidElement,
} from "react";
import {
  Ion,
  OpenStreetMapImageryProvider,
  Cartesian3,
  ImageryLayer,
  Viewer as CesiumViewer,
} from "cesium";
import DataSourceLayer from "../layers/DataSourceLayer";
import type {
  CesiumMapProps,
  LayerProps,
  RendererRegistry,
  LayerData,
  CesiumMapApi,
  ViewerWithConfigs,
} from "../../types";
import { useViewer } from "../../hooks/useViewer";
import { useLayerManager } from "../../hooks/useLayerManager";
import { useFilterManager } from "../../hooks/useFilterManager";
import { useSearchManager } from "../../hooks/useSearchManager";
import { useEntitiesManager } from "../../hooks/useEntitiesManager";
import { extractLayersFromChildren, hasLayersChanged } from "./utils";
import { createEventHandler } from "./utils/EventHandler";
import { useBindHandlers } from "./handlers/bindHandlers";

const CesiumMap = <R extends RendererRegistry>({
  children,
  defaultToken,
  renderers,
  animateActivation = false,
  animateVisibility = false,
  onApiReady,
  onEntityCreating,
  onEntityCreate,
  onEntityChange,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onChangePosition,
}: CesiumMapProps<R> & { onApiReady?: (api: CesiumMapApi) => void }) => {
  const { setViewer: setContextViewer } = useViewer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<ViewerWithConfigs<R> | null>(null);
  const imageryLayerRef = useRef<ImageryLayer | null>(null);

  // Extract layer props from children
  const layersRef = useRef<LayerProps<LayerData, R>[]>([]);
  const layers = useMemo(() => {
    const layerArray = extractLayersFromChildren<R>(children);
    if (hasLayersChanged(layerArray, layersRef.current)) {
      layersRef.current = layerArray;
    }
    return layersRef.current;
  }, [children]);

  const layersPanelApi = useLayerManager(layers);
  const filtersPanelApi = useFilterManager(layers, layersPanelApi.layerStates);
  const searchPanelApi = useSearchManager(filtersPanelApi.filterData, layers);
  const entitiesApi = useEntitiesManager();

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Set Ion token if provided
    if (defaultToken) {
      Ion.defaultAccessToken = defaultToken;
    }

    // Create viewer
    const newViewer = new CesiumViewer(containerRef.current, {
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
    }) as ViewerWithConfigs<R>;

    setViewer(newViewer);

    // Update context viewer
    setContextViewer(newViewer as unknown as ViewerWithConfigs);

    // Set mapref
    newViewer.mapref = { onEntityCreating, onEntityCreate };

    // Set up handlers
    newViewer.handlers = {
      onClick: createEventHandler(),
      onClickPrevented: createEventHandler(),
      onSelected: createEventHandler(),
      onChangePosition: createEventHandler(),
      onEntityChange: createEventHandler(),
    };

    // Add OpenStreetMap imagery layer
    const imageryProvider = new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
    });
    const imageryLayer =
      newViewer.imageryLayers.addImageryProvider(imageryProvider);
    imageryLayerRef.current = imageryLayer;

    // Set initial camera position
    newViewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-98.5795, 39.8283, 8000000),
      duration: 2,
    });

    // Cleanup on unmount
    return () => {
      if (newViewer && !newViewer.isDestroyed()) {
        newViewer.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layers and renderers properties on viewer when layers or renderers change
  useEffect(() => {
    if (viewer) {

      viewer.layers = {
        getLayerConfig: (layerId: string) =>
          layers.find((layer) => layer.id === layerId) as
          | LayerProps<LayerData, R>
          | undefined,
        getAllLayerConfigs: () =>
          layers as LayerProps<LayerData, R>[],
      };

      viewer.renderers = {
        getRenderers: () => renderers,
      };

      viewer.filters = filtersPanelApi;

    }
  }, [viewer, layers, renderers, filtersPanelApi]);

  // Handle street map visibility
  useEffect(() => {
    if (imageryLayerRef.current) {
      imageryLayerRef.current.show =
        layersPanelApi.layerStates["street-map"]?.isVisible ?? true;
    }
  }, [layersPanelApi.layerStates]);

  // Handle onClick and onSelecting callbacks
  const { processEntityChange } = useBindHandlers({
    viewer,
    onClick,
    onSelecting,
    onClickPrevented,
    onSelected,
    onChangePosition,
    onEntityChange,
  });

  const api = useMemo<CesiumMapApi | null>(() => {
    if (!layersPanelApi || !filtersPanelApi || !searchPanelApi || !entitiesApi) return null;
    return {
      api: {
        layersPanel: layersPanelApi,
        filtersPanel: filtersPanelApi,
        searchPanel: searchPanelApi,
        entities: entitiesApi,
      },
    };
  }, [layersPanelApi, filtersPanelApi, searchPanelApi, entitiesApi]);

  const prevApiRef = useRef<CesiumMapApi | null>(null);

  useEffect(() => {
    if (typeof onApiReady === "function" && api && api !== prevApiRef.current) {
      prevApiRef.current = api;
      onApiReady(api);
    }
  }, [api, onApiReady]);

  return (
    <div className="cesium-map-container">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {viewer && (
        <div className="zoom-controls">
          <button
            className="zoom-button zoom-in"
            onClick={() => {
              const height = viewer.camera.positionCartographic.height;
              const zoomAmount = Math.max(height * 0.1, 10000);
              viewer.camera.zoomIn(zoomAmount);
            }}
          >
            +
          </button>
          <button
            className="zoom-button zoom-out"
            onClick={() => {
              const height = viewer.camera.positionCartographic.height;
              const zoomAmount = Math.max(height * 0.1, 10000);
              viewer.camera.zoomOut(zoomAmount);
            }}
          >
            -
          </button>
        </div>
      )}
      {viewer &&
        layers.map((layer) => (
          <DataSourceLayer
            key={layer.id}
            viewer={viewer}
            id={layer.id}
            type={layer.type}
            isActive={layersPanelApi.layerStates[layer.id]?.isActive ?? true}
            isVisible={layersPanelApi.layerStates[layer.id]?.isVisible ?? true}
            data={layer.data}
            customRenderer={layer.customRenderer}
            renderers={renderers}
            animateActivation={animateActivation}
            animateVisibility={animateVisibility}
            onEntityChange={processEntityChange}
          />
        ))}
    </div>
  );
};

export default CesiumMap;
