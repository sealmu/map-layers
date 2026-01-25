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
  ViewerWithConfigs,
  MapApi,
} from "../../types";
import { useViewer } from "../../hooks/useViewer";
import { useFeatures } from "../../features/useFeatures";
import { useFeatureChangeEvent } from "../../features/useFeatureChangeEvent";
import { extractLayersFromChildren, hasLayersChanged } from "./utils";
import { createEventHandler } from "./utils/EventHandler";
import { useBindHandlers } from "./handlers/bindHandlers";

// Module-level variable to hold current API
let currentViewerApi: MapApi | null = null;

const CesiumMap = <R extends RendererRegistry>({
  children,
  defaultToken,
  renderers,
  animateActivation = false,
  animateVisibility = false,
  onApiChange,
  onEntityCreating,
  onEntityCreate,
  onEntityChange,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onChangePosition,
  onFeatureStateChanged,
  plugins = {},
}: CesiumMapProps<R>) => {
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

  const { layersPanelApi, filtersPanelApi, searchPanelApi, entitiesApi } = useFeatures(layers);

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

    // Define getter for viewer.api to always return current API
    Object.defineProperty(newViewer, 'api', {
      get: () => currentViewerApi,
      enumerable: true,
      configurable: true,
    });

    // Set up handlers
    newViewer.handlers = {
      onClick: createEventHandler(),
      onSelecting: createEventHandler(),
      onClickPrevented: createEventHandler(),
      onSelected: createEventHandler(),
      onChangePosition: createEventHandler(),
      onEntityChange: createEventHandler(),
      onApiChange: createEventHandler(),
    };

    // Set up plugins
    newViewer.plugins = {};

    // Set up mapref callbacks
    newViewer.mapref = {
      onEntityCreating,
      onEntityCreate,
    };

    setViewer(newViewer);

    // Create initial API
    const initialApi = {
      layersPanel: layersPanelApi,
      filtersPanel: filtersPanelApi,
      searchPanel: searchPanelApi,
      entities: entitiesApi,
    };

    // Update module-level API variable
    currentViewerApi = initialApi;

    // Update context viewer
    setContextViewer(newViewer as unknown as ViewerWithConfigs);

    // Emit initial API change event asynchronously to allow subscriptions to be set up
    Promise.resolve().then(() => {
      newViewer.handlers.onApiChange.subscribers.forEach((callback) => {
        callback(initialApi);
      });
    });

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

      // Create new API object
      const api = {
        layersPanel: layersPanelApi,
        filtersPanel: filtersPanelApi,
        searchPanel: searchPanelApi,
        entities: entitiesApi,
      };

      // Update module-level API variable (viewer.api getter will return this)
      currentViewerApi = api;

      // Notify parent component of API change
      onApiChange?.(api);

      // Emit API change event on viewer
      viewer.handlers.onApiChange.subscribers.forEach((callback) => {
        callback(api);
      });

      // Instantiate plugins when APIs are ready
      if (Object.keys(viewer.plugins).length === 0 && Object.keys(plugins).length > 0) {
        const api = {
          api: viewer.api,
          viewer,
        };
        for (const [name, PluginClass] of Object.entries(plugins)) {
          const instance = new PluginClass(api);
          viewer.plugins[name] = instance;
        }
      }

    }
  }, [viewer, layers, renderers, filtersPanelApi, layersPanelApi, searchPanelApi, entitiesApi, plugins, onApiChange]);

  // Handle feature state changes
  useFeatureChangeEvent(layersPanelApi, filtersPanelApi, searchPanelApi, entitiesApi, onFeatureStateChanged);

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
