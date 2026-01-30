import {
  Viewer as CesiumViewer,
  Cartesian2,
  Cartographic,
  defined,
  Math as CesiumMath,
} from "cesium";
import type { MapClickLocation } from "../types";

/**
 * Converts a screen position to geographic location
 * @param viewer - The Cesium viewer instance
 * @param position - Screen position (Cartesian2)
 * @returns MapClickLocation with cartesian, cartographic, and degree coordinates, or null if position is off the globe
 */
export function getLocationFromPosition(
  viewer: CesiumViewer,
  position: Cartesian2
): MapClickLocation | null {
  const cartesian = viewer.camera.pickEllipsoid(
    position,
    viewer.scene.globe.ellipsoid
  );
  if (!defined(cartesian)) return null;

  const cartographic = Cartographic.fromCartesian(cartesian);
  return {
    cartesian,
    cartographic,
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    height: cartographic.height,
  };
}
