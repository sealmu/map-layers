import {
  useState,
  useEffect,
  useMemo,
  useRef,
  Children,
  isValidElement,
} from "react";
import {
  Viewer as CesiumViewer,
  Ion,
  OpenStreetMapImageryProvider,
  Cartesian3,
  ImageryLayer,
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

const CesiumMap = <R extends RendererRegistry>({
  children,
  defaultToken,
  renderers,
  animateActivation = false,
  animateVisibility = false,
  onApiReady,
  onEntityCreating,
  onEntityCreate,
}: CesiumMapProps<R> & { onApiReady?: (api: CesiumMapApi) => void }) => {
  const { setViewer: setContextViewer } = useViewer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<ViewerWithConfigs<R> | null>(null);
  const imageryLayerRef = useRef<ImageryLayer | null>(null);

  // Extract layer props from children
  const layersRef = useRef<LayerProps<LayerData, R>[]>([]);
  const layers = useMemo(() => {
    const layerArray: LayerProps<LayerData, R>[] = [];
    Children.toArray(children).forEach((child) => {
      if (isValidElement(child) && child.props) {
        layerArray.push(child.props as LayerProps<LayerData, R>);
      }
    });
    // Only update if the layers actually changed (deep compare)
    const hasChanged =
      layerArray.length !== layersRef.current.length ||
      layerArray.some((layer, i) => {
        if (i >= layersRef.current.length) return true;
        const prev = layersRef.current[i];
        return (
          layer.id !== prev.id ||
          layer.name !== prev.name ||
          layer.type !== prev.type ||
          layer.isDocked !== prev.isDocked
        );
      });
    if (hasChanged) {
      layersRef.current = layerArray;
    }
    return layersRef.current;
  }, [children]);

  const layersPanelApi = useLayerManager(layers);
  const filtersPanelApi = useFilterManager();

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
    });

    setViewer(newViewer as ViewerWithConfigs<R>);

    // Update context viewer
    setContextViewer(newViewer);

    // Set mapref
    (newViewer as ViewerWithConfigs<R>).mapref = { onEntityCreating, onEntityCreate };

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

      (viewer as ViewerWithConfigs<R>).layers = {
        getLayerConfig: (layerId: string) =>
          layers.find((layer) => layer.id === layerId) as
          | LayerProps<LayerData, R>
          | undefined,
        getAllLayerConfigs: () =>
          layers as LayerProps<LayerData, R>[],
      };

      (viewer as ViewerWithConfigs<R>).renderers = {
        getRenderers: () => renderers,
      };

      (viewer as ViewerWithConfigs<R>).filters = {
        getFilters: filtersPanelApi.getFilters,
      };


    }
  }, [viewer, layers, renderers, filtersPanelApi]);

  // Handle street map visibility
  useEffect(() => {
    if (imageryLayerRef.current) {
      imageryLayerRef.current.show =
        layersPanelApi.layerStates["street-map"]?.isVisible ?? true;
    }
  }, [layersPanelApi.layerStates]);

  const api = useMemo<CesiumMapApi | null>(() => {
    if (!layersPanelApi || !filtersPanelApi) return null;
    return {
      api: {
        layersPanel: layersPanelApi,
        filtersPanel: filtersPanelApi,
      },
    };
  }, [layersPanelApi, filtersPanelApi]);

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
            name={layer.name}
            type={layer.type}
            isActive={layersPanelApi.layerStates[layer.id]?.isActive ?? true}
            isVisible={layersPanelApi.layerStates[layer.id]?.isVisible ?? true}
            data={layer.data}
            customRenderer={layer.customRenderer}
            renderers={renderers}
            animateActivation={animateActivation}
            animateVisibility={animateVisibility}
          />
        ))}
    </div>
  );
};

export default CesiumMap;
