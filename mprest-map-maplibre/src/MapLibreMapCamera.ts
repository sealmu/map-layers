import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  IMapCamera,
  IFlyToOptions,
  ICoordinate,
  IScreenPosition,
  ICameraOrientation,
  ICameraDestination,
  IBoundingBox,
} from "@mprest/map-core";
import { toLngLat } from "./adapters/coordinateAdapter";

/**
 * MapLibre implementation of IMapCamera
 */
export class MapLibreMapCamera implements IMapCamera {
  private map: MapLibreMap;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  // ============================================
  // State Accessors
  // ============================================

  getPosition(): ICoordinate {
    const center = this.map.getCenter();
    return {
      latitude: center.lat,
      longitude: center.lng,
      height: this.zoomToAltitude(this.map.getZoom()),
    };
  }

  getOrientation(): ICameraOrientation {
    return {
      heading: (this.map.getBearing() * Math.PI) / 180,
      pitch: (this.map.getPitch() * Math.PI) / 180,
      roll: 0,
    };
  }

  // ============================================
  // Navigation
  // ============================================

  async flyTo(
    destination: ICameraDestination,
    options?: IFlyToOptions,
  ): Promise<void> {
    const lngLat = toLngLat(destination.position);

    return new Promise((resolve) => {
      this.map.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: this.altitudeToZoom(destination.position.height ?? 1000000),
        bearing: destination.orientation
          ? (destination.orientation.heading * 180) / Math.PI
          : this.map.getBearing(),
        pitch: destination.orientation
          ? (destination.orientation.pitch * 180) / Math.PI
          : this.map.getPitch(),
        duration: (options?.duration ?? 1.5) * 1000,
      });

      this.map.once("moveend", () => resolve());
    });
  }

  setView(destination: ICameraDestination): void {
    const lngLat = toLngLat(destination.position);

    this.map.jumpTo({
      center: [lngLat.lng, lngLat.lat],
      zoom: this.altitudeToZoom(destination.position.height ?? 1000000),
      bearing: destination.orientation
        ? (destination.orientation.heading * 180) / Math.PI
        : this.map.getBearing(),
      pitch: destination.orientation
        ? (destination.orientation.pitch * 180) / Math.PI
        : this.map.getPitch(),
    });
  }

  zoomIn(_amount: number = 2): void {
    this.map.zoomIn({ duration: 300 });
  }

  zoomOut(_amount: number = 2): void {
    this.map.zoomOut({ duration: 300 });
  }

  // ============================================
  // Bounds
  // ============================================

  async flyToBoundingBox(
    bounds: IBoundingBox,
    options?: IFlyToOptions,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.map.fitBounds(
        [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
        {
          duration: (options?.duration ?? 1.5) * 1000,
          padding: 50,
        },
      );

      this.map.once("moveend", () => resolve());
    });
  }

  // ============================================
  // Picking
  // ============================================

  pickPosition(screenPosition: IScreenPosition): ICoordinate | null {
    const lngLat = this.map.unproject([screenPosition.x, screenPosition.y]);

    if (!lngLat) {
      return null;
    }

    return {
      latitude: lngLat.lat,
      longitude: lngLat.lng,
      height: 0,
    };
  }

  // ============================================
  // Extended methods (MapLibre-specific utilities)
  // ============================================

  flyToLocation(
    coordinate: ICoordinate,
    options?: {
      heading?: number;
      pitch?: number;
      range?: number;
      duration?: number;
    },
  ): void {
    const lngLat = toLngLat(coordinate);
    const zoom = options?.range
      ? this.altitudeToZoom(options.range)
      : this.map.getZoom();

    this.map.flyTo({
      center: [lngLat.lng, lngLat.lat],
      zoom,
      bearing: options?.heading !== undefined
        ? (options.heading * 180) / Math.PI
        : this.map.getBearing(),
      pitch: options?.pitch !== undefined
        ? (options.pitch * 180) / Math.PI
        : this.map.getPitch(),
      duration: (options?.duration ?? 1.5) * 1000,
    });
  }

  /**
   * Get the native MapLibre map
   */
  getNativeMap(): MapLibreMap {
    return this.map;
  }

  // ============================================
  // Private Helpers
  // ============================================

  private altitudeToZoom(altitude: number): number {
    // Approximate conversion from altitude (meters) to zoom level
    if (altitude <= 0) return 20;
    const zoom = Math.log2(40000000 / altitude);
    return Math.max(0, Math.min(20, zoom));
  }

  private zoomToAltitude(zoom: number): number {
    // Inverse of altitudeToZoom: altitude = 40000000 / 2^zoom
    return 40000000 / Math.pow(2, zoom);
  }
}

/**
 * Create a MapLibreMapCamera instance from a map
 */
export function createMapLibreMapCamera(map: MapLibreMap): IMapCamera {
  return new MapLibreMapCamera(map);
}
