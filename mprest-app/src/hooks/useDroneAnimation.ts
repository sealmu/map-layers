import { useEffect } from "react";
import { Cartesian3 } from "cesium";
import { DataManager } from "@mprest/map";
import type { DroneAnimationConfig, ViewerWithConfigs } from "@mprest/map";

export function useDroneAnimation(
  viewer: ViewerWithConfigs | null,
  config: DroneAnimationConfig,
) {
  const {
    droneId,
    centerLon,
    centerLat,
    radius,
    baseAlt,
    altAmp,
    segments,
    orbitDurationMs,
  } = config;

  useEffect(() => {
    if (!viewer) return;

    const dataManager = new DataManager(viewer as ViewerWithConfigs);

    const waypoints: [number, number, number][] = Array.from(
      { length: segments },
      (_v, i) => {
        const theta = (2 * Math.PI * i) / segments;
        const lon = centerLon + radius * Math.cos(theta);
        const lat = centerLat + radius * Math.sin(theta);
        const alt = baseAlt + altAmp * Math.sin(theta * 2);
        return [lon, lat, alt];
      },
    );

    const startTime = performance.now();
    let rafId: number;

    const step = (time: number) => {
      // Always ensure we have a live entity (layer might have been toggled)
      const currentEntity = dataManager.getItem(droneId);
      if (!currentEntity) {
        rafId = requestAnimationFrame(step);
        return;
      }

      const elapsed = (time - startTime + orbitDurationMs) % orbitDurationMs;
      const totalSegments = waypoints.length;
      const progress = (elapsed / orbitDurationMs) * totalSegments;
      const i0 = Math.floor(progress) % totalSegments;
      const i1 = (i0 + 1) % totalSegments;
      const t = progress - Math.floor(progress);

      const [lon1, lat1, alt1] = waypoints[i0];
      const [lon2, lat2, alt2] = waypoints[i1];

      const lon = lon1 + (lon2 - lon1) * t;
      const lat = lat1 + (lat2 - lat1) * t;
      const alt = alt1 + (alt2 - alt1) * t;

      // Update drone position using DataManager with entity instance
      dataManager.updateItem(currentEntity, {
        position: Cartesian3.fromDegrees(lon, lat, alt),
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [
    viewer,
    centerLat,
    centerLon,
    altAmp,
    baseAlt,
    droneId,
    orbitDurationMs,
    radius,
    segments,
  ]);
}
