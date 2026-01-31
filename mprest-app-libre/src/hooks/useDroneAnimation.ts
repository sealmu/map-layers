import { useEffect, useRef } from "react";
import type { ViewerWithConfigs } from "@mprest/map-maplibre";
import { createMapLibreDataManager } from "@mprest/map-maplibre";

export interface DroneAnimationConfig {
  droneId: string;
  centerLon: number;
  centerLat: number;
  radius: number; // in degrees
  segments: number;
  orbitDurationMs: number;
}

/**
 * Animates a drone feature in a circular orbit around a center point.
 *
 * Uses DataManager for direct entity mutation (like Cesium).
 * The entity is marked as animated so React won't overwrite its position.
 */
export function useDroneAnimation(
  viewer: ViewerWithConfigs | null,
  config: DroneAnimationConfig,
) {
  const {
    droneId,
    centerLon,
    centerLat,
    radius,
    segments,
    orbitDurationMs,
  } = config;

  const startTimeRef = useRef<number | null>(null);
  const dataManagerRef = useRef<ReturnType<typeof createMapLibreDataManager> | null>(null);
  const layerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!viewer) return;

    const map = viewer.map;
    if (!map) return;

    // Create data manager
    const dataManager = createMapLibreDataManager(viewer);
    dataManagerRef.current = dataManager;

    // Generate waypoints in a circular path
    const waypoints: [number, number][] = Array.from(
      { length: segments },
      (_v, i) => {
        const theta = (2 * Math.PI * i) / segments;
        const lon = centerLon + radius * Math.cos(theta);
        const lat = centerLat + radius * Math.sin(theta);
        return [lon, lat];
      },
    );

    let rafId: number;
    let isRunning = true;
    let animationStarted = false;

    // Find the drone and start animation
    const startAnimation = (): boolean => {
      if (animationStarted) return true;

      // Find the drone in the feature store
      for (const [layerId, features] of viewer.featureStore.entries()) {
        if (features.has(droneId)) {
          layerIdRef.current = layerId;
          // Mark as animated - React will preserve this feature
          dataManager.startAnimation(droneId, layerId);
          animationStarted = true;
          return true;
        }
      }
      return false;
    };

    const step = (time: number) => {
      if (!isRunning) return;

      if (!map || viewer.isDestroyed()) {
        return;
      }

      // Try to start animation
      if (!startAnimation()) {
        rafId = requestAnimationFrame(step);
        return;
      }

      // Initialize start time
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }

      // Calculate current position from time
      const elapsed = (time - startTimeRef.current + orbitDurationMs) % orbitDurationMs;
      const totalSegments = waypoints.length;
      const progress = (elapsed / orbitDurationMs) * totalSegments;
      const i0 = Math.floor(progress) % totalSegments;
      const i1 = (i0 + 1) % totalSegments;
      const t = progress - Math.floor(progress);

      const [lon1, lat1] = waypoints[i0];
      const [lon2, lat2] = waypoints[i1];

      const lon = lon1 + (lon2 - lon1) * t;
      const lat = lat1 + (lat2 - lat1) * t;

      // Update position directly via dataManager (like Cesium)
      dataManager.setEntityPosition(droneId, lon, lat, undefined, layerIdRef.current || undefined);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);

      // Stop animation - remove the animated flag
      if (dataManagerRef.current && layerIdRef.current) {
        dataManagerRef.current.stopAnimation(droneId, layerIdRef.current);
      }

      startTimeRef.current = null;
      layerIdRef.current = null;
    };
  }, [
    viewer,
    centerLat,
    centerLon,
    droneId,
    orbitDurationMs,
    radius,
    segments,
  ]);
}
