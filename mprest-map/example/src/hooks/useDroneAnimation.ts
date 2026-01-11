import { useEffect } from "react";
import {
  Cartesian3,
  Viewer as CesiumViewer,
  Entity,
  ConstantPositionProperty,
} from "cesium";
import type { DroneAnimationConfig } from "@mprest/map";

export function useDroneAnimation(
  viewer: CesiumViewer | null,
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

    // Generate circular path waypoints
    const waypoints: [number, number, number][] = Array.from(
      { length: segments },
      (_v, i) => {
        const theta = (2 * Math.PI * i) / segments;
        const lon = centerLon + radius * Math.cos(theta);
        const lat = centerLat + radius * Math.sin(theta);
        const alt = baseAlt + altAmp * Math.sin(theta * 2); // gentle vertical oscillation
        return [lon, lat, alt];
      },
    );

    const startTime = performance.now();
    let rafId: number;
    let droneEntity: Entity | null = null;

    // Find the drone entity in all data sources
    const findDroneEntity = () => {
      for (let i = 0; i < viewer.dataSources.length; i++) {
        const dataSource = viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(droneId);
        if (entity) {
          return entity;
        }
      }
      return null;
    };

    const step = (time: number) => {
      // Lazy-find the entity on first frame or if lost
      if (!droneEntity) {
        droneEntity = findDroneEntity();
        if (!droneEntity) {
          rafId = requestAnimationFrame(step);
          return;
        }
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

      // Update entity position directly in Cesium
      droneEntity.position = new ConstantPositionProperty(
        Cartesian3.fromDegrees(lon, lat, alt),
      );

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);
}
