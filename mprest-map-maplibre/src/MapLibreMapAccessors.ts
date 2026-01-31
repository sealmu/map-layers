import type {
  IMapAccessors,
  IEntityMetadata,
  ILayerMetadata,
  ICoordinate,
  ICameraOrientation,
} from "@mprest/map-core";
import type { ViewerWithConfigs, MapLibreFeature } from "./types";
import { MapLibreMapCamera } from "./MapLibreMapCamera";

/**
 * MapLibre implementation of IMapAccessors
 * Uses composition with MapLibreMapCamera for camera operations
 */
export class MapLibreMapAccessors implements IMapAccessors {
  private viewer: ViewerWithConfigs;

  /** Camera control interface */
  readonly camera: MapLibreMapCamera;

  private selectedFeatureId: string | null = null;

  constructor(viewer: ViewerWithConfigs) {
    this.viewer = viewer;
    this.camera = new MapLibreMapCamera(viewer.map);
  }

  getLayerNames(): string[] {
    return Array.from(this.viewer.featureStore.keys());
  }

  getLayerMetadata(layerName: string): ILayerMetadata | null {
    const layerFeatures = this.viewer.featureStore.get(layerName);
    if (!layerFeatures) return null;

    const style = this.viewer.map.getStyle();
    const mapLayer = style?.layers?.find(
      (l) => 'source' in l && l.source === layerName,
    );

    return {
      name: layerName,
      show: mapLayer ? this.viewer.map.getLayoutProperty(mapLayer.id, "visibility") !== "none" : true,
      entityCount: layerFeatures.size,
    };
  }

  getLayerEntities(layerName: string): IEntityMetadata[] {
    const entities: IEntityMetadata[] = [];
    const layerFeatures = this.viewer.featureStore.get(layerName);

    if (layerFeatures) {
      for (const feature of layerFeatures.values()) {
        entities.push({
          id: feature.id,
          name: (feature.properties?.name as string) || feature.id,
          layerId: layerName,
          renderType: feature.renderType,
          show: feature.properties?.show !== false,
        });
      }
    }

    return entities;
  }

  findEntityById(id: string, layerName?: string): IEntityMetadata | null {
    if (layerName) {
      const layerFeatures = this.viewer.featureStore.get(layerName);
      const feature = layerFeatures?.get(id);
      if (feature) {
        return {
          id: feature.id,
          name: (feature.properties?.name as string) || feature.id,
          layerId: layerName,
          renderType: feature.renderType,
          show: feature.properties?.show !== false,
        };
      }
      return null;
    }

    // Search all layers
    for (const [layer, features] of this.viewer.featureStore.entries()) {
      const feature = features.get(id);
      if (feature) {
        return {
          id: feature.id,
          name: (feature.properties?.name as string) || feature.id,
          layerId: layer,
          renderType: feature.renderType,
          show: feature.properties?.show !== false,
        };
      }
    }

    return null;
  }

  setEntityVisibility(id: string, visible: boolean, layerName?: string, triggerUpdate: boolean = true): boolean {
    const updateFeature = (feature: MapLibreFeature, layer: string): boolean => {
      if (feature.properties) {
        feature.properties.show = visible;
      }
      // Only trigger source update if requested
      if (triggerUpdate) {
        this.updateSourceForLayer(layer);
      }
      return true;
    };

    if (layerName) {
      const layerFeatures = this.viewer.featureStore.get(layerName);
      const feature = layerFeatures?.get(id);
      if (feature) {
        return updateFeature(feature, layerName);
      }
      return false;
    }

    // Search all layers
    for (const [layer, features] of this.viewer.featureStore.entries()) {
      const feature = features.get(id);
      if (feature) {
        return updateFeature(feature, layer);
      }
    }

    return false;
  }

  batchSetEntityVisibility(updates: Array<{id: string, visible: boolean}>, layerName: string): void {
    const layerFeatures = this.viewer.featureStore.get(layerName);
    if (!layerFeatures) return;

    // Update all features without triggering source updates
    for (const { id, visible } of updates) {
      const feature = layerFeatures.get(id);
      if (feature?.properties) {
        feature.properties.show = visible;
      }
    }

    // Single source update at the end
    this.updateSourceForLayer(layerName);
  }

  getNativeEntity<T = unknown>(id: string, layerName?: string): T | null {
    if (layerName) {
      const layerFeatures = this.viewer.featureStore.get(layerName);
      const feature = layerFeatures?.get(id);
      return feature as unknown as T | null;
    }

    // Search all layers
    for (const features of this.viewer.featureStore.values()) {
      const feature = features.get(id);
      if (feature) {
        return feature as unknown as T;
      }
    }

    return null;
  }

  selectEntity(id: string, layerName?: string): boolean {
    const feature = this.getNativeEntity<MapLibreFeature>(id, layerName);
    if (feature) {
      this.selectedFeatureId = id;

      // Emit selection event
      if (this.viewer.handlers?.onSelected?.subscribers) {
        const position = this.getFeaturePosition(feature);
        const location = position
          ? {
              lngLat: { lng: position.longitude, lat: position.latitude } as import("maplibre-gl").LngLat,
              longitude: position.longitude,
              latitude: position.latitude,
              point: { x: 0, y: 0 },
            }
          : undefined;

        for (const callback of this.viewer.handlers.onSelected.subscribers) {
          callback(feature, location);
        }
      }

      return true;
    }
    return false;
  }

  getSelectedEntityId(): string | null {
    return this.selectedFeatureId;
  }

  async flyToEntity(
    id: string,
    options?: {
      layerName?: string;
      range?: number;
      duration?: number;
    },
  ): Promise<void> {
    const feature = this.getNativeEntity<MapLibreFeature>(id, options?.layerName);
    if (!feature) return;

    const position = this.getFeaturePosition(feature);
    if (!position) return;

    this.camera.flyToLocation(position, {
      range: options?.range,
      duration: options?.duration ?? 1.5,
    });
  }

  // ============================================
  // Camera methods (delegated to MapLibreMapCamera)
  // ============================================

  getCameraPosition(): ICoordinate {
    return this.camera.getPosition();
  }

  getCameraOrientation(): ICameraOrientation {
    return this.camera.getOrientation();
  }

  flyToLocation(
    coordinate: ICoordinate,
    options?: {
      heading?: number;
      pitch?: number;
      range?: number;
      duration?: number;
    },
  ): void {
    this.camera.flyToLocation(coordinate, options);
  }

  // ============================================
  // Direct Entity Mutation (like Cesium)
  // ============================================

  /**
   * Set entity position directly (like Cesium entity.position = ...)
   * Marks the entity as animated so React won't overwrite it
   */
  setEntityPosition(
    id: string,
    longitude: number,
    latitude: number,
    height?: number,
    layerName?: string,
  ): boolean {
    const feature = this.getNativeEntity<MapLibreFeature>(id, layerName);
    if (!feature) return false;

    if (feature.geometry.type === "Point") {
      feature.geometry.coordinates = height !== undefined
        ? [longitude, latitude, height]
        : [longitude, latitude];

      // Mark as animated so React preserves this feature
      if (feature.properties) {
        feature.properties.__animated = true;
      }

      // Update the source
      const layer = layerName || feature.layerId;
      if (layer) {
        this.updateSourceForLayer(layer);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear animated flag - call when animation ends
   */
  clearAnimatedFlag(id: string, layerName?: string): void {
    const feature = this.getNativeEntity<MapLibreFeature>(id, layerName);
    if (feature?.properties) {
      delete feature.properties.__animated;
    }
  }

  /**
   * Update the map source from featureStore for a layer
   * Call this after direct entity mutations
   */
  updateSourceForLayer(layerName: string): void {
    const map = this.viewer.map;
    const source = map.getSource(layerName);
    if (source && source.type === "geojson") {
      const layerFeatures = this.viewer.featureStore.get(layerName);
      if (layerFeatures) {
        const featureCollection = {
          type: "FeatureCollection" as const,
          features: Array.from(layerFeatures.values()),
        };
        (source as import("maplibre-gl").GeoJSONSource).setData(featureCollection);
      }
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private getFeaturePosition(feature: MapLibreFeature): ICoordinate | null {
    const geometry = feature.geometry;
    if (!geometry) return null;

    if (geometry.type === "Point") {
      return {
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
        height: geometry.coordinates[2] ?? 0,
      };
    } else if (geometry.type === "Polygon") {
      // Return centroid
      const ring = geometry.coordinates[0];
      if (!ring || ring.length === 0) return null;
      const sumLng = ring.reduce((acc, c) => acc + c[0], 0);
      const sumLat = ring.reduce((acc, c) => acc + c[1], 0);
      return {
        longitude: sumLng / ring.length,
        latitude: sumLat / ring.length,
        height: 0,
      };
    } else if (geometry.type === "LineString") {
      // Return midpoint
      const coords = geometry.coordinates;
      const midIndex = Math.floor(coords.length / 2);
      return {
        longitude: coords[midIndex][0],
        latitude: coords[midIndex][1],
        height: coords[midIndex][2] ?? 0,
      };
    }

    return null;
  }

}

/**
 * Create a MapLibreMapAccessors instance from a viewer
 */
export function createMapLibreMapAccessors(viewer: ViewerWithConfigs): MapLibreMapAccessors {
  return new MapLibreMapAccessors(viewer);
}
