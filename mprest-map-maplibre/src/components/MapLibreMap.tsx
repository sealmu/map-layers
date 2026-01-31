import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapLibreDataSourceLayer from "./MapLibreDataSourceLayer";
import type {
  MapLibreMapProps,
  LayerProps,
  RendererRegistry,
  LayerData,
  ViewerWithConfigs,
  MapApi,
  MapLibreFeature,
  MapClickLocation,
} from "../types";
import { useViewer, createEventHandler, type IViewerWithConfigs } from "@mprest/map-core";
import { extractLayersFromChildren, hasLayersChanged } from "../utils";
import { useExtensions } from "../extensions/useExtensions";
import { useExtensionChangeEvent } from "../extensions/useExtensionChangeEvent";
import { createMapLibreMapAccessors } from "../MapLibreMapAccessors";

// Module-level variable to hold current API
let currentViewerApi: MapApi | null = null;

const MapLibreMap = <R extends RendererRegistry>({
  children,
  renderers,
  style = "https://demotiles.maplibre.org/style.json",
  center = [-98.5795, 39.8283],
  zoom = 3,
  onApiChange,
  onEntityCreating,
  onEntityCreate,
  onEntityChange,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onChangePosition,
  onExtensionStateChanged,
  plugins = {},
}: MapLibreMapProps<R>) => {
  const { setViewer: setContextViewer } = useViewer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<ViewerWithConfigs<R> | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const viewerRef = useRef<ViewerWithConfigs<R> | null>(null);

  // Extract layer props from children
  const layersRef = useRef<LayerProps<LayerData, R>[]>([]);
  const layers = useMemo(() => {
    const layerArray = extractLayersFromChildren<R>(children);
    if (hasLayersChanged(layerArray, layersRef.current)) {
      layersRef.current = layerArray;
    }
    return layersRef.current;
  }, [children]);

  const featuresApi = useExtensions(layers) as MapApi;
  const { layers: layersApi, filters: filtersApi, search: searchApi, entities: entitiesApi } = featuresApi;

  // Initialize MapLibre Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Create map
    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Create viewer wrapper object
      const viewerWrapper = {
        map,
        featureStore: new Map<string, Map<string, MapLibreFeature>>(),
        providerType: "maplibre" as const,
        handlers: {
          onClick: createEventHandler(),
          onSelecting: createEventHandler(),
          onClickPrevented: createEventHandler(),
          onSelected: createEventHandler(),
          onChangePosition: createEventHandler(),
          onEntityChange: createEventHandler(),
          onApiChange: createEventHandler(),
          onEntityCreating: createEventHandler(),
          onEntityCreate: createEventHandler(),
        },
        plugins: {},
        layersConfig: {
          getLayerConfig: (layerId: string) =>
            layers.find((layer) => layer.id === layerId) as
            | LayerProps<LayerData, R>
            | undefined,
          getAllLayerConfigs: () => layers as LayerProps<LayerData, R>[],
        },
        renderers: {
          getRenderers: () => renderers,
        },
        api: null as unknown as MapApi,
        accessors: null as unknown as ReturnType<typeof createMapLibreMapAccessors>,
        getNativeMap: () => map,
        isDestroyed: () => !mapRef.current,
      } as ViewerWithConfigs<R>;

      // Set up accessors
      viewerWrapper.accessors = createMapLibreMapAccessors(viewerWrapper as unknown as ViewerWithConfigs);

      // Define getter for viewer.api
      Object.defineProperty(viewerWrapper, 'api', {
        get: () => currentViewerApi,
        enumerable: true,
        configurable: true,
      });

      viewerRef.current = viewerWrapper;
      setViewer(viewerWrapper);

      // Update module-level API variable
      currentViewerApi = featuresApi;

      // Update context viewer
      setContextViewer(viewerWrapper as unknown as IViewerWithConfigs);

      // Emit initial API change event
      Promise.resolve().then(() => {
        viewerWrapper.handlers.onApiChange.subscribers.forEach((callback) => {
          callback(featuresApi);
        });
      });
    });

    // Set up click handler
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point);
      const location: MapClickLocation = {
        lngLat: e.lngLat,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        point: { x: e.point.x, y: e.point.y },
      };

      let feature: MapLibreFeature | null = null;
      // Filter to only include features from our data layers (check featureStore)
      // Must have viewerRef.current and the feature source must be in our featureStore
      if (viewerRef.current) {
        const appFeature = features.find((f) =>
          f.source && viewerRef.current!.featureStore.has(f.source as string)
        );
        if (appFeature) {
          // Get the feature ID - try properties.id first (our ID), then MapLibre's id
          const featureId = String(appFeature.properties?.id || appFeature.id || "");
          const layerId = appFeature.source as string;

          // Look up the actual feature from featureStore for complete data
          const storedFeature = viewerRef.current.featureStore.get(layerId)?.get(featureId);

          if (storedFeature) {
            // Use the stored feature which has all our metadata
            feature = storedFeature;
          } else {
            // Fallback to constructing from queryRenderedFeatures result
            feature = {
              type: "Feature",
              id: featureId,
              geometry: appFeature.geometry as MapLibreFeature["geometry"],
              properties: appFeature.properties || {},
              layerId: layerId,
              renderType: appFeature.properties?.rendererType,
            };
          }
        }
      }

      // Call onClick subscribers (use viewerRef, not viewer state)
      if (viewerRef.current) {
        for (const callback of viewerRef.current.handlers.onClick.subscribers) {
          callback(feature, location);
        }

        // If there's a feature, check onSelecting first
        if (feature) {
          let selectionAllowed = true;

          // Call onSelecting subscribers - if any return false, selection is prevented
          for (const callback of viewerRef.current.handlers.onSelecting.subscribers) {
            const result = callback(feature, location);
            if (result === false) {
              selectionAllowed = false;
              break;
            }
          }

          if (!selectionAllowed) {
            // Call onClickPrevented subscribers
            for (const callback of viewerRef.current.handlers.onClickPrevented.subscribers) {
              callback(feature, location);
            }
          } else {
            // Call onSelected subscribers
            for (const callback of viewerRef.current.handlers.onSelected.subscribers) {
              callback(feature, location);
            }
          }
        } else {
          // No feature - just call onSelected with null
          for (const callback of viewerRef.current.handlers.onSelected.subscribers) {
            callback(feature, location);
          }
        }
      }
    });

    // Set up mouse move handler for position changes
    map.on("mousemove", (e) => {
      const location: MapClickLocation = {
        lngLat: e.lngLat,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        point: { x: e.point.x, y: e.point.y },
      };

      // Use viewerRef, not viewer state
      if (viewerRef.current) {
        for (const callback of viewerRef.current.handlers.onChangePosition.subscribers) {
          callback(location);
        }
      }
    });

    // Add navigation control
    map.addControl(new maplibregl.NavigationControl());

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe prop callbacks
  useEffect(() => {
    if (!viewer) return;

    const unsubscribers: (() => void)[] = [];

    if (onClick) {
      unsubscribers.push(viewer.handlers.onClick.subscribe(onClick));
    }
    if (onSelecting) {
      unsubscribers.push(viewer.handlers.onSelecting.subscribe(onSelecting));
    }
    if (onClickPrevented) {
      unsubscribers.push(viewer.handlers.onClickPrevented.subscribe(onClickPrevented));
    }
    if (onSelected) {
      unsubscribers.push(viewer.handlers.onSelected.subscribe(onSelected));
    }
    if (onChangePosition) {
      unsubscribers.push(viewer.handlers.onChangePosition.subscribe(onChangePosition));
    }
    if (onEntityChange) {
      unsubscribers.push(viewer.handlers.onEntityChange.subscribe(onEntityChange));
    }
    if (onEntityCreating) {
      unsubscribers.push(viewer.handlers.onEntityCreating.subscribe(onEntityCreating));
    }
    if (onEntityCreate) {
      unsubscribers.push(viewer.handlers.onEntityCreate.subscribe(onEntityCreate));
    }

    // Cleanup: unsubscribe all when callbacks change
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [viewer, onClick, onSelecting, onClickPrevented, onSelected, onChangePosition, onEntityChange, onEntityCreating, onEntityCreate]);

  // Update layers and renderers on viewer when they change
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

      // Update module-level API variable
      currentViewerApi = featuresApi;

      // Notify parent component
      onApiChange?.(featuresApi);

      // Emit API change event
      viewer.handlers.onApiChange.subscribers.forEach((callback) => {
        callback(featuresApi);
      });

      // Instantiate plugins and subscribe their handlers
      if (Object.keys(viewer.plugins).length === 0 && Object.keys(plugins).length > 0) {
        const mapInstance = { viewer };
        for (const [name, PluginClass] of Object.entries(plugins)) {
          const instance = new PluginClass(mapInstance);
          viewer.plugins[name] = instance;

          // Subscribe plugin handlers to viewer events
          if (instance.onClick) {
            viewer.handlers.onClick.subscribe(instance.onClick.bind(instance));
          }
          if (instance.onSelecting) {
            viewer.handlers.onSelecting.subscribe(instance.onSelecting.bind(instance));
          }
          if (instance.onClickPrevented) {
            viewer.handlers.onClickPrevented.subscribe(instance.onClickPrevented.bind(instance));
          }
          if (instance.onSelected) {
            viewer.handlers.onSelected.subscribe(instance.onSelected.bind(instance));
          }
          if (instance.onChangePosition) {
            viewer.handlers.onChangePosition.subscribe(instance.onChangePosition.bind(instance));
          }
          if (instance.onEntityChange) {
            viewer.handlers.onEntityChange.subscribe(instance.onEntityChange.bind(instance));
          }
        }
      }
    }
  }, [viewer, layers, renderers, featuresApi, plugins, onApiChange]);

  // Handle extension state changes
  useExtensionChangeEvent(layersApi, filtersApi, searchApi, entitiesApi, onExtensionStateChanged);

  return (
    <div className="maplibre-map-container" style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {viewer &&
        layers.map((layer) => (
          <MapLibreDataSourceLayer
            key={layer.id}
            map={viewer}
            id={layer.id}
            type={layer.type}
            isActive={layersApi.layerStates[layer.id]?.isActive ?? true}
            isVisible={layersApi.layerStates[layer.id]?.isVisible ?? true}
            data={layer.data}
            customRenderer={layer.customRenderer}
            renderers={renderers}
            onEntityChange={(feature, status, layerId) => {
              viewer.handlers.onEntityChange.subscribers.forEach((cb) =>
                cb(feature, status, layerId),
              );
            }}
            onEntityCreating={(feature, item) => {
              viewer.handlers.onEntityCreating.subscribers.forEach((cb) =>
                cb(feature, item),
              );
            }}
            onEntityCreate={(type, item, rends, layerId) => {
              for (const callback of viewer.handlers.onEntityCreate.subscribers) {
                const result = callback(type, item, rends, layerId);
                if (result) return result;
              }
              return null;
            }}
          />
        ))}
    </div>
  );
};

export default MapLibreMap;
