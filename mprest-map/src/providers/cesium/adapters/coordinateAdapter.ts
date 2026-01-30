import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Cartesian2,
} from "cesium";
import type { ICoordinate, IScreenPosition } from "../../../types/core/types/coordinates";

/**
 * Convert ICoordinate to Cesium Cartesian3
 */
export function toCartesian3(coord: ICoordinate): Cartesian3 {
  return Cartesian3.fromDegrees(
    coord.longitude,
    coord.latitude,
    coord.height ?? 0,
  );
}

/**
 * Convert Cesium Cartesian3 to ICoordinate
 */
export function toCoordinate(cartesian: Cartesian3): ICoordinate {
  const cartographic = Cartographic.fromCartesian(cartesian);
  return {
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    height: cartographic.height,
  };
}

/**
 * Convert array of ICoordinate to array of Cartesian3
 */
export function toCartesian3Array(coords: ICoordinate[]): Cartesian3[] {
  return coords.map(toCartesian3);
}

/**
 * Convert array of Cartesian3 to array of ICoordinate
 */
export function toCoordinateArray(cartesians: Cartesian3[]): ICoordinate[] {
  return cartesians.map(toCoordinate);
}

/**
 * Convert Cesium Cartographic to ICoordinate
 */
export function fromCartographic(cartographic: Cartographic): ICoordinate {
  return {
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    height: cartographic.height,
  };
}

/**
 * Convert ICoordinate to Cesium Cartographic
 */
export function toCartographic(coord: ICoordinate): Cartographic {
  return Cartographic.fromDegrees(
    coord.longitude,
    coord.latitude,
    coord.height ?? 0,
  );
}

/**
 * Convert IScreenPosition to Cesium Cartesian2
 */
export function toCartesian2(pos: IScreenPosition): Cartesian2 {
  return new Cartesian2(pos.x, pos.y);
}

/**
 * Convert Cesium Cartesian2 to IScreenPosition
 */
export function toScreenPosition(cartesian2: Cartesian2): IScreenPosition {
  return {
    x: cartesian2.x,
    y: cartesian2.y,
  };
}
