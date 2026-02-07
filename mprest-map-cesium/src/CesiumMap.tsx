import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Ion,
  Cartesian3,
  Viewer as CesiumViewer,
} from "cesium";
import CesiumDataSourceLayer from "./CesiumDataSourceLayer";
import type {
  CesiumMapProps,
  LayerProps,
  RendererRegistry,
  LayerData,
  ViewerWithConfigs,
  MapApi,
} from "./types";
import { useViewer, createEventHandler, callAllSubscribers, setLogHandler, type IViewerWithConfigs, type IMapConfig } from "@mprest/map-core";
import { extractLayersFromChildren, hasLayersChanged } from "./utils";
import { useExtensions } from "./extensions/useExtensions";
import { useExtensionChangeEvent } from "./extensions/useExtensionChangeEvent";
import { useBindHandlers } from "./handlers/bindHandlers";
import { createCesiumMapAccessors } from "./CesiumMapAccessors";
import { createCesiumDataManager } from "./CesiumDataManager";

// Module-level variable to hold current API
let currentViewerApi: MapApi | null = null;

// Default map configuration
const DEFAULT_MAP_CONFIG: IMapConfig = {
  center: { longitude: -98.5795, latitude: 39.8283, height: 8000000 },
  animationDuration: 2,
};

const CesiumMap = <R extends RendererRegistry>({
  children,
  defaultToken,
  renderers,
  mapConfig,
  baseMapProviders,
  filterConfig,
  selectionIndicator = true,
  infoBox = true,
  multiSelect,
  animateActivation = false,
  animateVisibility = false,
  onApiChange,
  onMapReady,
  onLog,
  onEntityCreating,
  onEntityCreate,
  onEntityChange,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onRightClick,
  onDblClick,
  onLeftDown,
  onLeftUp,
  onRightDown,
  onRightUp,
  onChangePosition,
  onMultiSelecting,
  onMultiSelect,
  onRenderMultiSelection,
  onExtensionStateChanged,
  plugins = {},
}: CesiumMapProps<R>) => {
  const { setViewer: setContextViewer } = useViewer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<ViewerWithConfigs<R> | null>(null);

  // Track map ready states
  const mapReadyFired = useRef(false);
  const readyState = useRef({ viewer: false, tiles: false, camera: false });

  // Helper to check and fire map ready event
  const checkAndFireMapReady = (newViewer: ViewerWithConfigs<R>) => {
    const { viewer: viewerReady, tiles, camera } = readyState.current;
    if (viewerReady && tiles && camera && !mapReadyFired.current) {
      mapReadyFired.current = true;
      callAllSubscribers(newViewer.handlers.onMapReady);
    }
  };

  // Extract layer props from children
  const layersRef = useRef<LayerProps<LayerData, R>[]>([]);
  const layers = useMemo(() => {
    const layerArray = extractLayersFromChildren<LayerProps<LayerData, R>>(children);
    if (hasLayersChanged(layerArray, layersRef.current)) {
      layersRef.current = layerArray;
    }
    return layersRef.current;
  }, [children]);

  const extensionContext = useMemo(() => ({ baseMapProviders, filterConfig, multiSelect, onMultiSelecting, onMultiSelect, onRenderMultiSelection }), [baseMapProviders, filterConfig, multiSelect, onMultiSelecting, onMultiSelect, onRenderMultiSelection]);
  const featuresApi = useExtensions(layers, extensionContext) as MapApi;
  const { layers: layersApi, filters: filtersApi, search: searchApi, entities: entitiesApi } = featuresApi;

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
      selectionIndicator,
      infoBox,
    }) as ViewerWithConfigs<R>;

    // Remove default imagery layer if baseMapProviders is used
    // This allows our managed base maps to be visible
    if (baseMapProviders && baseMapProviders.length > 0) {
      newViewer.imageryLayers.removeAll();
    }

    // Define getter for viewer.api to always return current API
    Object.defineProperty(newViewer, 'api', {
      get: () => currentViewerApi,
      enumerable: true,
      configurable: true,
    });

    // Set up handlers (all use EventHandler pattern for consistency)
    newViewer.handlers = {
      onClick: createEventHandler(),
      onSelecting: createEventHandler(),
      onClickPrevented: createEventHandler(),
      onSelected: createEventHandler(),
      onRightClick: createEventHandler(),
      onDblClick: createEventHandler(),
      onLeftDown: createEventHandler(),
      onLeftUp: createEventHandler(),
      onRightDown: createEventHandler(),
      onRightUp: createEventHandler(),
      onChangePosition: createEventHandler(),
      onEntityChange: createEventHandler(),
      onApiChange: createEventHandler(),
      onEntityCreating: createEventHandler(),
      onEntityCreate: createEventHandler(),
      onMapReady: createEventHandler(),
      onLog: createEventHandler(),
    };

    // Subscribe prop callbacks as first subscribers
    if (onMapReady) {
      newViewer.handlers.onMapReady.subscribe(onMapReady);
    }
    if (onLog) {
      newViewer.handlers.onLog.subscribe(onLog);
    }

    // Wire up global logger to route through onLog handler
    setLogHandler((entry) => {
      callAllSubscribers(newViewer.handlers.onLog, entry);
    });

    // Set up plugins
    newViewer.plugins = {};

    // Set up provider-agnostic accessors
    newViewer.accessors = createCesiumMapAccessors(newViewer);

    // Set up data manager for entity CRUD operations
    newViewer.dataManager = createCesiumDataManager(newViewer);

    // Set provider type for component delegation
    newViewer.providerType = 'cesium';

    setViewer(newViewer);

    // Create initial API (includes core features + plugins)
    const initialApi = featuresApi;

    // Update module-level API variable
    currentViewerApi = initialApi;

    // Update context viewer (cast to provider-agnostic type for context)
    setContextViewer(newViewer as unknown as IViewerWithConfigs);

    // Emit initial API change event asynchronously to allow subscriptions to be set up
    Promise.resolve().then(() => {
      newViewer.handlers.onApiChange.subscribers.forEach((callback) => {
        callback(initialApi);
      });
    });

    // Mark viewer as ready
    readyState.current.viewer = true;

    // Track tiles loaded state
    const tileLoadListener = newViewer.scene.globe.tileLoadProgressEvent.addEventListener(
      (queueLength: number) => {
        if (queueLength === 0 && !readyState.current.tiles) {
          readyState.current.tiles = true;
          checkAndFireMapReady(newViewer);
        }
      }
    );

    // Set initial camera position and track completion
    const center = mapConfig?.center ?? DEFAULT_MAP_CONFIG.center!;
    const duration = mapConfig?.animationDuration ?? DEFAULT_MAP_CONFIG.animationDuration;
    const orientation = mapConfig?.orientation;

    newViewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        center.longitude,
        center.latitude,
        center.height ?? 8000000
      ),
      duration,
      orientation: orientation ? {
        heading: orientation.heading ?? 0,
        pitch: orientation.pitch ?? -90,
        roll: orientation.roll ?? 0,
      } : undefined,
      complete: () => {
        readyState.current.camera = true;
        checkAndFireMapReady(newViewer);
      },
    });

    // Cleanup on unmount
    return () => {
      tileLoadListener();
      setLogHandler(null);
      if (newViewer && !newViewer.isDestroyed()) {
        newViewer.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layers and renderers properties on viewer when layers or renderers change
  useEffect(() => {
    if (viewer) {

      viewer.layersConfig = {
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

      // Create new API object (includes core features + plugins)
      const api = featuresApi;

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
        const map = { viewer };
        for (const [name, PluginClass] of Object.entries(plugins)) {
          const instance = new PluginClass(map);
          viewer.plugins[name] = instance;
        }
      }

    }
  }, [viewer, layers, renderers, featuresApi, plugins, onApiChange]);

  // Handle extension state changes
  useExtensionChangeEvent(layersApi, filtersApi, searchApi, entitiesApi, onExtensionStateChanged);

  // Handle click and position callbacks via handlers
  const { processEntityChange, processEntityCreating, processEntityCreate } = useBindHandlers({
    viewer,
    onClick,
    onSelecting,
    onClickPrevented,
    onSelected,
    onRightClick,
    onDblClick,
    onLeftDown,
    onLeftUp,
    onRightDown,
    onRightUp,
    onChangePosition,
    onEntityChange,
    onEntityCreating,
    onEntityCreate,
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
          <CesiumDataSourceLayer
            key={layer.id}
            viewer={viewer}
            id={layer.id}
            type={layer.type}
            isActive={layersApi.layerStates[layer.id]?.isActive ?? true}
            isVisible={layersApi.layerStates[layer.id]?.isVisible ?? true}
            data={layer.data}
            customRenderer={layer.customRenderer}
            renderers={renderers}
            animateActivation={animateActivation}
            animateVisibility={animateVisibility}
            onEntityChange={processEntityChange}
            onEntityCreating={layer.onEntityCreating
              ? (options, item) => {
                if (layer.onEntityCreating!(options, item) === false) return false;
                return processEntityCreating?.(options, item);
              }
              : processEntityCreating}
            onEntityCreate={processEntityCreate}
          />
        ))}
    </div>
  );
};

export default CesiumMap;
