import { useCallback, useMemo } from "react";
import { useViewer } from "@mprest/map-core";
import type { IMapCamera, IBoundingBox, ICoordinate } from "@mprest/map-core";
import type { ExtensionModule, ExtensionContext } from "../../types";

// ============================================
// Zoom Target Types
// ============================================

export interface ZoomCoordinates {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface ZoomBoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ZoomToEntityTarget {
  entityId: string;
  layerId?: string;
}

export interface ZoomToCoordinatesTarget {
  coordinates: ZoomCoordinates;
}

export interface ZoomToBoundingBoxTarget {
  boundingBox: ZoomBoundingBox;
}

export interface ZoomToEntitiesTarget {
  entityIds: string[];
  layerId?: string;
}

export type ZoomTarget =
  | "in"
  | "out"
  | ZoomToEntityTarget
  | ZoomToCoordinatesTarget
  | ZoomToBoundingBoxTarget
  | ZoomToEntitiesTarget;

// ============================================
// Zoom Options
// ============================================

export interface ZoomOptions {
  /** Zoom target - 'in', 'out', entity, coordinates, boundingBox, or multiple entities */
  target: ZoomTarget;
  /** Zoom factor for 'in'/'out' targets (default: 2) */
  amount?: number;
  /** Animation duration in seconds (default: 1.5) */
  duration?: number;
  /** Camera heading in radians */
  heading?: number;
  /** Camera pitch in radians (default: -45 degrees) */
  pitch?: number;
  /** Distance from target in meters (for entity/coordinates zoom) */
  range?: number;
  /** Whether to animate the transition (default: true) */
  animate?: boolean;
}

export interface ZoomInOutOptions {
  /** Zoom factor (default: 2) */
  amount?: number;
}

export interface ZoomToLocationOptions {
  /** Animation duration in seconds (default: 1.5) */
  duration?: number;
  /** Camera heading in radians */
  heading?: number;
  /** Camera pitch in radians (default: -45 degrees) */
  pitch?: number;
  /** Distance from target in meters */
  range?: number;
  /** Whether to animate the transition (default: true) */
  animate?: boolean;
}

// ============================================
// Map API Interface
// ============================================

export interface ZoomApi {
  /**
   * Unified zoom method with various target options
   */
  zoom: (options: ZoomOptions) => Promise<boolean>;

  /**
   * Simple zoom in
   */
  zoomIn: (options?: ZoomInOutOptions) => void;

  /**
   * Simple zoom out
   */
  zoomOut: (options?: ZoomInOutOptions) => void;

  /**
   * Zoom to a specific entity
   */
  zoomToEntity: (
    entityId: string,
    layerId?: string,
    options?: ZoomToLocationOptions
  ) => Promise<boolean>;

  /**
   * Zoom to multiple entities (fits all in view)
   */
  zoomToEntities: (
    entityIds: string[],
    layerId?: string,
    options?: ZoomToLocationOptions
  ) => Promise<boolean>;

  /**
   * Zoom to specific coordinates
   */
  zoomToCoordinates: (
    coordinates: ZoomCoordinates,
    options?: ZoomToLocationOptions
  ) => boolean;

  /**
   * Zoom to a bounding box area
   */
  zoomToBoundingBox: (
    boundingBox: ZoomBoundingBox,
    options?: ZoomToLocationOptions
  ) => Promise<boolean>;

  /**
   * Get current camera height (zoom level indicator)
   */
  getZoomLevel: () => number;
}

// ============================================
// Default Options
// ============================================

const DEFAULT_ZOOM_AMOUNT = 2;
const DEFAULT_DURATION = 1.5;
const DEFAULT_PITCH = -45 * (Math.PI / 180);
const DEFAULT_RANGE = 100000;

// ============================================
// Helper Functions
// ============================================

function isZoomToEntityTarget(target: ZoomTarget): target is ZoomToEntityTarget {
  return typeof target === "object" && "entityId" in target;
}

function isZoomToCoordinatesTarget(target: ZoomTarget): target is ZoomToCoordinatesTarget {
  return typeof target === "object" && "coordinates" in target;
}

function isZoomToBoundingBoxTarget(target: ZoomTarget): target is ZoomToBoundingBoxTarget {
  return typeof target === "object" && "boundingBox" in target;
}

function isZoomToEntitiesTarget(target: ZoomTarget): target is ZoomToEntitiesTarget {
  return typeof target === "object" && "entityIds" in target;
}

// ============================================
// Hook Implementation
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useMap = (_ctx: ExtensionContext): ZoomApi => {
  const { viewer } = useViewer();

  // Get camera interface - prefer accessors.camera if available
  const getCamera = useCallback((): IMapCamera | null => {
    if (!viewer) return null;
    // Use accessors.camera if available (provider-agnostic)
    if (viewer.accessors && "camera" in viewer.accessors) {
      return (viewer.accessors as { camera: IMapCamera }).camera;
    }
    return null;
  }, [viewer]);

  const zoomIn = useCallback(
    (options?: ZoomInOutOptions): void => {
      const camera = getCamera();
      if (!camera) return;
      camera.zoomIn(options?.amount ?? DEFAULT_ZOOM_AMOUNT);
    },
    [getCamera]
  );

  const zoomOut = useCallback(
    (options?: ZoomInOutOptions): void => {
      const camera = getCamera();
      if (!camera) return;
      camera.zoomOut(options?.amount ?? DEFAULT_ZOOM_AMOUNT);
    },
    [getCamera]
  );

  const zoomToCoordinates = useCallback(
    (coordinates: ZoomCoordinates, options?: ZoomToLocationOptions): boolean => {
      if (!viewer?.accessors) return false;

      const coordinate: ICoordinate = {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        height: coordinates.height ?? 0,
      };

      // Use the accessors.flyToLocation for provider-agnostic navigation
      viewer.accessors.flyToLocation(coordinate, {
        heading: options?.heading ?? 0,
        pitch: options?.pitch ?? DEFAULT_PITCH,
        range: options?.range ?? DEFAULT_RANGE,
        duration: options?.animate === false ? 0 : (options?.duration ?? DEFAULT_DURATION),
      });

      return true;
    },
    [viewer]
  );

  const zoomToBoundingBox = useCallback(
    async (boundingBox: ZoomBoundingBox, options?: ZoomToLocationOptions): Promise<boolean> => {
      const camera = getCamera();
      if (!camera) return false;

      const bounds: IBoundingBox = {
        west: boundingBox.west,
        south: boundingBox.south,
        east: boundingBox.east,
        north: boundingBox.north,
      };

      await camera.flyToBoundingBox(bounds, {
        duration: options?.animate === false ? 0 : (options?.duration ?? DEFAULT_DURATION),
      });

      return true;
    },
    [getCamera]
  );

  const zoomToEntity = useCallback(
    async (entityId: string, layerId?: string, options?: ZoomToLocationOptions): Promise<boolean> => {
      if (!viewer?.accessors) return false;

      // Check if entity exists
      const entityMeta = viewer.accessors.findEntityById(entityId, layerId);
      if (!entityMeta) return false;

      await viewer.accessors.flyToEntity(entityId, {
        layerName: layerId,
        range: options?.range ?? DEFAULT_RANGE,
        duration: options?.animate === false ? 0 : (options?.duration ?? DEFAULT_DURATION),
      });

      return true;
    },
    [viewer]
  );

  const zoomToEntities = useCallback(
    async (entityIds: string[], layerId?: string, options?: ZoomToLocationOptions): Promise<boolean> => {
      if (!viewer?.accessors || entityIds.length === 0) return false;

      // For multiple entities, we need to compute a bounding box
      // Get positions of all entities and create a bounding box
      const positions: ICoordinate[] = [];

      for (const entityId of entityIds) {
        const entityMeta = viewer.accessors.findEntityById(entityId, layerId);
        if (!entityMeta) continue;

        // Get native entity to access position
        const nativeEntity = viewer.accessors.getNativeEntity(entityId, layerId);
        if (!nativeEntity) continue;

        // Try to get position from entity (Cesium-specific)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entity = nativeEntity as any;
        if (entity.position) {
          try {
            const { Cartographic, Math: CesiumMath } = await import("cesium");
            const cartesian = entity.position.getValue?.(new Date()) ?? entity.position;
            if (cartesian) {
              const cartographic = Cartographic.fromCartesian(cartesian);
              positions.push({
                longitude: CesiumMath.toDegrees(cartographic.longitude),
                latitude: CesiumMath.toDegrees(cartographic.latitude),
                height: cartographic.height,
              });
            }
          } catch {
            // If we can't get position, skip this entity
          }
        }
      }

      if (positions.length === 0) return false;

      // If only one entity found, zoom to it directly
      if (positions.length === 1) {
        return zoomToCoordinates(positions[0], options);
      }

      // Compute bounding box from positions
      let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
      for (const pos of positions) {
        west = Math.min(west, pos.longitude);
        south = Math.min(south, pos.latitude);
        east = Math.max(east, pos.longitude);
        north = Math.max(north, pos.latitude);
      }

      // Add some padding (5% on each side)
      const lonPadding = (east - west) * 0.05 || 0.01;
      const latPadding = (north - south) * 0.05 || 0.01;

      return zoomToBoundingBox({
        west: west - lonPadding,
        south: south - latPadding,
        east: east + lonPadding,
        north: north + latPadding,
      }, options);
    },
    [viewer, zoomToCoordinates, zoomToBoundingBox]
  );

  const getZoomLevel = useCallback((): number => {
    const camera = getCamera();
    if (!camera) return 0;
    return camera.getPosition().height ?? 0;
  }, [getCamera]);

  const zoom = useCallback(
    async (options: ZoomOptions): Promise<boolean> => {
      const { target } = options;

      // Simple zoom in/out
      if (target === "in") {
        zoomIn({ amount: options.amount });
        return true;
      }

      if (target === "out") {
        zoomOut({ amount: options.amount });
        return true;
      }

      // Zoom to entity
      if (isZoomToEntityTarget(target)) {
        return zoomToEntity(target.entityId, target.layerId, {
          duration: options.duration,
          heading: options.heading,
          pitch: options.pitch,
          range: options.range,
          animate: options.animate,
        });
      }

      // Zoom to multiple entities
      if (isZoomToEntitiesTarget(target)) {
        return zoomToEntities(target.entityIds, target.layerId, {
          duration: options.duration,
          heading: options.heading,
          pitch: options.pitch,
          range: options.range,
          animate: options.animate,
        });
      }

      // Zoom to coordinates
      if (isZoomToCoordinatesTarget(target)) {
        return zoomToCoordinates(target.coordinates, {
          duration: options.duration,
          heading: options.heading,
          pitch: options.pitch,
          range: options.range,
          animate: options.animate,
        });
      }

      // Zoom to bounding box
      if (isZoomToBoundingBoxTarget(target)) {
        return zoomToBoundingBox(target.boundingBox, {
          duration: options.duration,
          heading: options.heading,
          pitch: options.pitch,
          range: options.range,
          animate: options.animate,
        });
      }

      return false;
    },
    [zoomIn, zoomOut, zoomToEntity, zoomToEntities, zoomToCoordinates, zoomToBoundingBox]
  );

  return useMemo(
    () => ({
      zoom,
      zoomIn,
      zoomOut,
      zoomToEntity,
      zoomToEntities,
      zoomToCoordinates,
      zoomToBoundingBox,
      getZoomLevel,
    }),
    [zoom, zoomIn, zoomOut, zoomToEntity, zoomToEntities, zoomToCoordinates, zoomToBoundingBox, getZoomLevel]
  );
};

// ============================================
// Extension Definition
// ============================================

const zoomExtension: ExtensionModule<ZoomApi> = {
  name: "zoom",
  useExtension: useMap,
  priority: 5, // Load early
};

// Type augmentation - makes api.zoom fully typed
declare module "../../types" {
  interface MapApi {
    zoom?: ZoomApi;
  }
}

export default zoomExtension;
