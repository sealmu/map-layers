import { useEffect, useRef, useCallback, useState } from "react";
import type { Map as MapLibreMapType, GeoJSONSource } from "maplibre-gl";
import type {
  DataSourceLayerProps,
  RendererRegistry,
  LayerData,
  MapLibreFeature,
  EntityChangeStatus,
} from "../types";
import type { FeatureCollection } from "geojson";

const MapLibreDataSourceLayer = <R extends RendererRegistry>({
  map: viewer,
  id,
  type,
  data,
  isActive,
  isVisible,
  customRenderer,
  renderers,
  onEntityChange,
  onEntityCreating,
  onEntityCreate,
}: DataSourceLayerProps<R>) => {
  const sourceAddedRef = useRef(false);
  const layerAddedRef = useRef(false);
  const [sourceReady, setSourceReady] = useState(false);

  // Create feature from data item
  const createFeature = useCallback(
    (item: LayerData): MapLibreFeature | null => {
      // Try onEntityCreate callback first
      if (onEntityCreate) {
        const result = onEntityCreate(type, item, renderers, id);
        if (result) {
          // Call onEntityCreating if provided
          if (onEntityCreating) {
            onEntityCreating(result, item);
          }
          return result;
        }
      }

      // Use custom renderer if provided
      if (customRenderer) {
        // Don't overwrite item's own customRenderer if it has one
        const feature = customRenderer(item);
        if (onEntityCreating) {
          onEntityCreating(feature, item);
        }
        return feature;
      }

      // Use renderer from registry
      const renderer = renderers[type];
      if (renderer) {
        const feature = renderer(item);
        if (onEntityCreating) {
          onEntityCreating(feature, item);
        }
        return feature;
      }

      return null;
    },
    [type, customRenderer, renderers, id, onEntityCreate, onEntityCreating],
  );

  // Initialize source and layers
  useEffect(() => {
    const nativeMap = viewer.getNativeMap();
    if (!nativeMap) return;

    // The viewer is only set after map.on("load"), so we can initialize immediately
    // Use setTimeout to ensure we're outside the React render cycle
    const timeoutId = setTimeout(() => {
      if (sourceAddedRef.current) return;
      // Re-check nativeMap since it could be destroyed during the timeout
      const map = viewer.getNativeMap();
      if (!map) return;

      // Create empty GeoJSON source
      if (!map.getSource(id)) {
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
          // promoteId helps MapLibre track feature identity across updates,
          // reducing flickering during animations
          promoteId: "id",
        });
        sourceAddedRef.current = true;
        setSourceReady(true); // Trigger re-render to update data
      }

      // Initialize feature store for this layer
      if (!viewer.featureStore.has(id)) {
        viewer.featureStore.set(id, new Map());
      }
    }, 0);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      const map = viewer.getNativeMap();
      if (map && sourceAddedRef.current) {
        // Remove all layers using this source
        const style = map.getStyle();
        if (style && style.layers) {
          for (const layer of style.layers) {
            if ('source' in layer && layer.source === id) {
              map.removeLayer(layer.id);
            }
          }
        }
        // Remove source
        if (map.getSource(id)) {
          map.removeSource(id);
        }
        sourceAddedRef.current = false;
        layerAddedRef.current = false;
      }
      // Clear feature store
      viewer.featureStore.delete(id);
    };
  }, [viewer, id]);

  // Update data when it changes
  useEffect(() => {
    const nativeMap = viewer.getNativeMap();
    if (!nativeMap || !sourceReady) return;

    // Get or create feature store for this layer
    let layerFeatures = viewer.featureStore.get(id);
    if (!layerFeatures) {
      layerFeatures = new Map();
      viewer.featureStore.set(id, layerFeatures);
    }

    // Track previous features for change detection
    const previousIds = new Set(layerFeatures.keys());
    const currentIds = new Set<string>();

    // Process data items
    const features: MapLibreFeature[] = [];

    if (data && data.length > 0) {
      data.forEach((item: LayerData) => {
        currentIds.add(item.id);

        // Check if feature already exists in featureStore
        const existingFeature = layerFeatures!.get(item.id);

        // If feature exists and is being animated externally, preserve it
        // This allows direct entity mutation like Cesium
        if (existingFeature && existingFeature.properties?.__animated) {
          features.push(existingFeature);
          return;
        }

        // Create new feature or update existing one
        const feature = createFeature(item);
        if (feature) {
          feature.layerId = id;
          // Preserve rendererType set by custom renderer, fallback to item.renderType or layer type
          const effectiveRenderType = feature.properties?.rendererType || item.renderType || type;
          feature.renderType = effectiveRenderType;
          if (feature.properties) {
            feature.properties.id = feature.id; // Ensure ID is in properties for queryRenderedFeatures
            feature.properties.layerId = id;
            feature.properties.rendererType = effectiveRenderType;
          }

          // Apply filter state
          if (viewer.api?.filters?.filterData?.[id]) {
            const filterTypes = viewer.api.filters.filterData[id]?.types;
            if (filterTypes && feature.renderType) {
              if (feature.properties) {
                feature.properties.show = filterTypes[feature.renderType] ?? true;
              }
            }
          }

          features.push(feature);
          layerFeatures!.set(feature.id, feature);

          // Check if this is a new feature
          if (!previousIds.has(feature.id)) {
            onEntityChange?.(feature, "added" as EntityChangeStatus, id);
          }
        }
      });
    }

    // Check for removed features
    for (const prevId of previousIds) {
      if (!currentIds.has(prevId)) {
        const removedFeature = layerFeatures.get(prevId);
        if (removedFeature) {
          onEntityChange?.(removedFeature, "removed" as EntityChangeStatus, id);
          layerFeatures.delete(prevId);
        }
      }
    }

    // Update source data from featureStore (not from newly created features)
    // This ensures animated features retain their current coordinates
    const source = nativeMap.getSource(id);
    if (source && source.type === "geojson") {
      const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: Array.from(layerFeatures.values()),
      };
      (source as GeoJSONSource).setData(featureCollection);
    }

    // Add layers if not already added
    if (!layerAddedRef.current && features.length > 0) {
      addLayers(nativeMap, features);
      layerAddedRef.current = true;
    }

    function addLayers(map: MapLibreMapType, features: MapLibreFeature[]) {
      // Determine what types of geometries we have
      const hasPoints = features.some((f) => f.geometry.type === "Point");
      const hasLines = features.some((f) => f.geometry.type === "LineString");
      const hasPolygons = features.some((f) => f.geometry.type === "Polygon");

      // Add polygon fill layer
      if (hasPolygons && !map.getLayer(`${id}-fill`)) {
        map.addLayer({
          id: `${id}-fill`,
          type: "fill",
          source: id,
          filter: ["all", ["==", ["geometry-type"], "Polygon"], ["!=", ["get", "show"], false]],
          paint: {
            "fill-color": ["coalesce", ["get", "fillColor"], "#3388ff"],
            "fill-opacity": ["coalesce", ["get", "fillOpacity"], 0.5],
          },
        });
      }

      // Add polygon outline layer
      if (hasPolygons && !map.getLayer(`${id}-outline`)) {
        map.addLayer({
          id: `${id}-outline`,
          type: "line",
          source: id,
          filter: ["all", ["==", ["geometry-type"], "Polygon"], ["!=", ["get", "show"], false]],
          paint: {
            "line-color": ["coalesce", ["get", "outlineColor"], "#3388ff"],
            "line-width": ["coalesce", ["get", "outlineWidth"], 2],
          },
        });
      }

      // Add line layer
      if (hasLines && !map.getLayer(`${id}-line`)) {
        map.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          filter: ["all", ["==", ["geometry-type"], "LineString"], ["!=", ["get", "show"], false]],
          paint: {
            "line-color": ["coalesce", ["get", "lineColor"], "#3388ff"],
            "line-width": ["coalesce", ["get", "lineWidth"], 3],
          },
        });
      }

      // Add circle layer for points
      if (hasPoints && !map.getLayer(`${id}-circle`)) {
        map.addLayer({
          id: `${id}-circle`,
          type: "circle",
          source: id,
          filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "show"], false]],
          paint: {
            "circle-color": ["coalesce", ["get", "pointColor"], "#3388ff"],
            "circle-radius": ["coalesce", ["get", "pointSize"], 10],
            "circle-stroke-color": ["coalesce", ["get", "outlineColor"], "#ffffff"],
            "circle-stroke-width": ["coalesce", ["get", "outlineWidth"], 2],
          },
        });
      }

      // Add symbol layer for labels
      if (hasPoints && !map.getLayer(`${id}-label`)) {
        map.addLayer({
          id: `${id}-label`,
          type: "symbol",
          source: id,
          filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "labelText"], ["!", ["has", "icon"]], ["!=", ["get", "show"], false]],
          layout: {
            "text-field": ["get", "labelText"],
            "text-size": ["coalesce", ["get", "labelSize"], 14],
            "text-offset": ["coalesce", ["get", "labelOffset"], ["literal", [0, 1.5]]],
            "text-anchor": ["coalesce", ["get", "labelAnchor"], "top"],
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": ["coalesce", ["get", "labelColor"], "#000000"],
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
          },
        });
      }

      // Add icon layer for features with icons
      const iconFeatures = features.filter(f => f.properties?.icon);
      if (iconFeatures.length > 0) {
        // Load icons and add icon layer
        const iconPromises = iconFeatures.map(async (f) => {
          const iconName = f.properties?.icon as string;
          if (!map.hasImage(iconName)) {
            // Check if it's a data URL or needs to be created
            const iconData = f.properties?.iconData as string | undefined;
            if (iconData) {
              return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  if (!map.hasImage(iconName)) {
                    map.addImage(iconName, img);
                  }
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = iconData;
              });
            }
          }
          return Promise.resolve();
        });

        Promise.all(iconPromises).then(() => {
          if (!map.getLayer(`${id}-icon`)) {
            map.addLayer({
              id: `${id}-icon`,
              type: "symbol",
              source: id,
              filter: ["all", ["==", ["geometry-type"], "Point"], ["has", "icon"], ["!=", ["get", "show"], false]],
              layout: {
                "icon-image": ["get", "icon"],
                "icon-size": ["coalesce", ["get", "iconSize"], 1],
                "icon-allow-overlap": true,
                "text-field": ["get", "labelText"],
                "text-size": ["coalesce", ["get", "labelSize"], 12],
                "text-offset": [0, 1.5],
                "text-anchor": "top",
                "text-optional": true,
              },
              paint: {
                "text-color": ["coalesce", ["get", "labelColor"], "#000000"],
                "text-halo-color": "#ffffff",
                "text-halo-width": 1,
              },
            });
          }
        });
      }
    }
  }, [data, type, customRenderer, renderers, createFeature, viewer, id, onEntityChange, sourceReady]);

  // Update visibility
  useEffect(() => {
    const nativeMap = viewer.getNativeMap();
    if (!nativeMap || !sourceReady) return;

    const visibility = (isVisible ?? true) ? "visible" : "none";
    const style = nativeMap.getStyle();
    if (style && style.layers) {
      for (const layer of style.layers) {
        if ('source' in layer && layer.source === id) {
          nativeMap.setLayoutProperty(layer.id, "visibility", visibility);
        }
      }
    }
  }, [isVisible, viewer, id, sourceReady]);

  // Update active state (add/remove from map)
  useEffect(() => {
    const nativeMap = viewer.getNativeMap();
    if (!nativeMap || !sourceReady) return;

    const shouldShow = isActive ?? true;
    const style = nativeMap.getStyle();

    if (style && style.layers) {
      for (const layer of style.layers) {
        if ('source' in layer && layer.source === id) {
          nativeMap.setLayoutProperty(
            layer.id,
            "visibility",
            shouldShow && (isVisible ?? true) ? "visible" : "none",
          );
        }
      }
    }
  }, [isActive, isVisible, viewer, id, sourceReady]);

  return null;
};

export default MapLibreDataSourceLayer;
