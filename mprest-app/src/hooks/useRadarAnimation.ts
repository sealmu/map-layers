import { useEffect } from "react";
import {
  Cartesian3,
  Cartographic,
  PolygonHierarchy,
  CallbackProperty,
} from "cesium";
import { DataManager } from "@mprest/map";
import type { ViewerWithConfigs } from "@mprest/map";

type RadarEntityData = {
  data?: {
    config?: {
      center?: [number, number, number];
      radius?: number;
      coneAngle?: number;
    };
  };
};

export function useRadarAnimation(
  viewer: ViewerWithConfigs | null,
  radarId: string,
) {
  useEffect(() => {
    try {
      if (!viewer || !viewer.dataSources) return;
    } catch {
      //console.error('Error accessing viewer.dataSources in useRadarAnimation:', e);
      return;
    }

    // Hardcoded defaults - will be overridden when entity is found
    let [lon, lat, alt] = [-98.5795, 39.8283, 1000];
    let coneAngleRadians = Math.PI / 6; // semi-angle - default value
    let baseRadius = 1500000;

    // Find the entity first to get config
    const initialDataManager = new DataManager(viewer);
    const entity = initialDataManager.getItem(radarId);

    // Read config from entity data if available
    if (entity) {
      const entityData = (entity as RadarEntityData).data;
      if (entityData?.config) {
        const config = entityData.config;
        if (config.center) {
          [lon, lat, alt] = config.center;
        }
        if (config.coneAngle) {
          coneAngleRadians = config.coneAngle; // semi-angle
        }
        if (config.radius) {
          baseRadius = config.radius;
        }
      }
    }

    const apex = Cartesian3.fromDegrees(lon, lat, alt);
    const baseAlt = 0;
    const carto = Cartographic.fromCartesian(apex);
    const numSides = 2;

    // Store current positions for the animation
    let currentPositions: Cartesian3[] = [apex];

    // Initialize with default positions (pointing north initially)
    for (let i = 0; i < numSides; i++) {
      const angle = coneAngleRadians * (i * 2 - 1); // -coneAngleRadians to +coneAngleRadians
      const deltaLon =
        ((baseRadius / 6371000) * Math.cos(angle)) / Math.cos(carto.latitude);
      const deltaLat = (baseRadius / 6371000) * Math.sin(angle);
      const posLon = carto.longitude + deltaLon;
      const posLat = carto.latitude + deltaLat;
      const pos = Cartesian3.fromRadians(posLon, posLat, baseAlt);
      currentPositions.push(pos);
    }
    currentPositions.push(apex); // Close the polygon

    // Create callback property for dynamic hierarchy
    const hierarchyCallback = () => {
      return new PolygonHierarchy(currentPositions);
    };

    if (entity && entity.polygon) {
      entity.polygon.hierarchy = new CallbackProperty(hierarchyCallback, false);
    }

    // Start animation immediately
    let rafId: number;
    let callbackSet = false;

    const animate = () => {
      // Check if viewer is still available and has dataSources
      if (!viewer || !viewer.dataSources) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      // Create fresh DataManager instance to avoid stale viewer reference
      const dataManager = new DataManager(viewer);

      // Always ensure we have a live entity (layer might have been toggled)
      const entity = dataManager.getItem(radarId);

      // If we haven't set up the callback yet and now we can, do it
      if (!callbackSet && entity && entity.polygon) {
        // Read coneAngle from entity data if available
        const entityData = (entity as RadarEntityData).data;
        if (entityData?.config?.coneAngle) {
          coneAngleRadians = entityData.config.coneAngle; // semi-angle
        }
        entity.polygon.hierarchy = new CallbackProperty(
          hierarchyCallback,
          false,
        );
        callbackSet = true;
      }

      if (!entity || !entity.polygon) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const offset = (performance.now() / 10000) % (2 * Math.PI); // rotate every 10 seconds

      const positions: Cartesian3[] = [apex];

      for (let i = 0; i < numSides; i++) {
        const angle = offset + (coneAngleRadians / 2) * (i * 2 - 1);
        const deltaLon =
          ((baseRadius / 6371000) * Math.cos(angle)) / Math.cos(carto.latitude);
        const deltaLat = (baseRadius / 6371000) * Math.sin(angle);
        const posLon = carto.longitude + deltaLon;
        const posLat = carto.latitude + deltaLat;
        const pos = Cartesian3.fromRadians(posLon, posLat, baseAlt);
        positions.push(pos);
      }
      positions.push(apex);

      // Update the current positions (this will trigger the callback)
      currentPositions = positions;

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [viewer, radarId]);
}
