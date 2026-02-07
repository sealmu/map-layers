import { useEffect, useCallback, useMemo } from "react";
import {
  Cartesian3,
  Cartographic,
  ConstantPositionProperty,
  type Entity,
} from "cesium";
import type { EntityChangeStatus } from "@mprest/map-core";
import { DataManager, type ViewerWithConfigs } from "@mprest/map-cesium";
import type { DroneAnimationConfig } from "../types";

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

    const dataManager = new DataManager(viewer);

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
      const mapEntity = dataManager.getItem(droneId);
      if (!mapEntity) {
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

      // Update drone position directly on native entity
      const entity = mapEntity.getNativeEntity<Entity>();
      entity.position = new ConstantPositionProperty(
        Cartesian3.fromDegrees(lon, lat, alt),
      );

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

export function useDroneAnimation2(viewer: ViewerWithConfigs | null) {
  const dataManager = useMemo(() => {
    if (!viewer) return null;
    return new DataManager(viewer);
  }, [viewer]);

  const handleEntityChange = useCallback(
    (
      entity: Entity,
      status: EntityChangeStatus,
      //_collectionName: string
    ) => {
      if (!dataManager) return;

      // Only react to changes in drone2
      if (entity.id !== "drone2" || status !== "changed") return;

      // Get current positions of both drones
      const drone1MapEntity = dataManager.getItem("drone1");
      const drone2MapEntity = dataManager.getItem("drone2");

      if (!drone1MapEntity || !drone2MapEntity) return;

      // Get native entities for position access
      const drone1Entity = drone1MapEntity.getNativeEntity<Entity>();
      const drone2Entity = drone2MapEntity.getNativeEntity<Entity>();

      // Get current positions
      const drone1Position = drone1Entity.position?.getValue(
        undefined as never,
      );
      const drone2Position = drone2Entity.position?.getValue(
        undefined as never,
      );

      if (!drone1Position || !drone2Position) return;

      // Convert to cartographic for easier calculations
      const drone1Cartographic = Cartographic.fromCartesian(drone1Position);
      const drone2Cartographic = Cartographic.fromCartesian(drone2Position);

      // Calculate the difference
      const lonDiff =
        drone2Cartographic.longitude - drone1Cartographic.longitude;
      const latDiff = drone2Cartographic.latitude - drone1Cartographic.latitude;
      const altDiff = drone2Cartographic.height - drone1Cartographic.height;

      // Calculate distance
      const distance = Math.sqrt(
        lonDiff * lonDiff + latDiff * latDiff + altDiff * altDiff,
      );

      // If too close, remove drone2 (drone1 has caught up)
      if (distance < 0.1) {
        // About 637 km - they've interlapsed
        dataManager.removeItem("drone2");
        return; // Stop processing this update
      }

      // Dynamic speed: 10x when far, 5x when close
      const closeDistanceThreshold = 1; // radians
      const speedMultiplier = distance > closeDistanceThreshold ? 20 : 5;
      const baseSpeed = 0.15 / 60; // drone2 speed per frame (0.15 degrees/sec / 60 fps)
      const maxMoveDistance = baseSpeed * speedMultiplier;
      const moveDistance = Math.min(maxMoveDistance, distance);

      // Normalize direction vector
      const directionLon = lonDiff / distance;
      const directionLat = latDiff / distance;
      const directionAlt = altDiff / distance;

      const newLon = drone1Cartographic.longitude + directionLon * moveDistance;
      const newLat = drone1Cartographic.latitude + directionLat * moveDistance;
      const newAlt = drone1Cartographic.height + directionAlt * moveDistance;

      // Update drone1 position directly on native entity
      drone1Entity.position = new ConstantPositionProperty(
        Cartesian3.fromRadians(newLon, newLat, newAlt),
      );
    },
    [dataManager],
  );

  useEffect(() => {
    if (!viewer) return;

    // Subscribe to entity changes
    const unsubscribe =
      viewer.handlers.onEntityChange.subscribe(handleEntityChange);

    return unsubscribe;
  }, [viewer, handleEntityChange]);
}
