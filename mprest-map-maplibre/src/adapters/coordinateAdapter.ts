import type { LngLat } from "maplibre-gl";
import type { ICoordinate, IScreenPosition } from "@mprest/map-core";

/**
 * Convert ICoordinate to MapLibre LngLat-like object
 */
export function toLngLat(coord: ICoordinate): { lng: number; lat: number } {
  return {
    lng: coord.longitude,
    lat: coord.latitude,
  };
}

/**
 * Convert MapLibre LngLat to ICoordinate
 */
export function toCoordinate(lngLat: LngLat | { lng: number; lat: number }, height?: number): ICoordinate {
  return {
    latitude: lngLat.lat,
    longitude: lngLat.lng,
    height: height ?? 0,
  };
}

/**
 * Convert ICoordinate to [lng, lat] array for GeoJSON
 */
export function toGeoJSONPosition(coord: ICoordinate): [number, number] {
  return [coord.longitude, coord.latitude];
}

/**
 * Convert ICoordinate to [lng, lat, alt] array for GeoJSON with altitude
 */
export function toGeoJSONPositionWithAlt(coord: ICoordinate): [number, number, number] {
  return [coord.longitude, coord.latitude, coord.height ?? 0];
}

/**
 * Convert [lng, lat] or [lng, lat, alt] to ICoordinate
 */
export function fromGeoJSONPosition(position: [number, number] | [number, number, number]): ICoordinate {
  return {
    longitude: position[0],
    latitude: position[1],
    height: position[2] ?? 0,
  };
}

/**
 * Convert array of ICoordinate to array of [lng, lat] for GeoJSON
 */
export function toGeoJSONPositions(coords: ICoordinate[]): [number, number][] {
  return coords.map(toGeoJSONPosition);
}

/**
 * Convert array of [lng, lat] to array of ICoordinate
 */
export function fromGeoJSONPositions(positions: [number, number][]): ICoordinate[] {
  return positions.map((pos) => fromGeoJSONPosition(pos));
}

/**
 * Convert { x, y } to IScreenPosition
 */
export function toScreenPosition(point: { x: number; y: number }): IScreenPosition {
  return {
    x: point.x,
    y: point.y,
  };
}

/**
 * Convert IScreenPosition to { x, y }
 */
export function fromScreenPosition(pos: IScreenPosition): { x: number; y: number } {
  return {
    x: pos.x,
    y: pos.y,
  };
}
