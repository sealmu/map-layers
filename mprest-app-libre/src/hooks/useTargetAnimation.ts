import { useCallback, useRef } from "react";
import type { ViewerWithConfigs, MapLibreFeature } from "@mprest/map-maplibre";
import { createMapLibreDataManager } from "@mprest/map-maplibre";

export interface TargetAnimationConfig {
  durationMs?: number; // Duration of flight to target (default 3000ms)
  onComplete?: (source: MapLibreFeature, target: MapLibreFeature) => void;
}

/**
 * Hook that provides a function to animate a source entity towards a target entity.
 *
 * Uses DataManager for direct entity mutation (like Cesium).
 * Call startTargetAnimation when onTargetSet fires.
 */
export function useTargetAnimation(
  viewer: ViewerWithConfigs | null,
  config: TargetAnimationConfig = {},
) {
  const { durationMs = 3000, onComplete } = config;

  const rafIdRef = useRef<number | null>(null);
  const dataManagerRef = useRef<ReturnType<typeof createMapLibreDataManager> | null>(null);
  const isAnimatingRef = useRef(false);
  const currentSourceRef = useRef<MapLibreFeature | null>(null);
  const currentTargetRef = useRef<MapLibreFeature | null>(null);
  const layerIdRef = useRef<string | null>(null);

  const stopAnimation = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Stop animation flag on the entity
    if (dataManagerRef.current && currentSourceRef.current && layerIdRef.current) {
      dataManagerRef.current.stopAnimation(currentSourceRef.current.id, layerIdRef.current);
    }

    isAnimatingRef.current = false;
    currentSourceRef.current = null;
    currentTargetRef.current = null;
    layerIdRef.current = null;
  }, []);

  const startTargetAnimation = useCallback((source: MapLibreFeature, target: MapLibreFeature) => {
    if (!viewer) return;

    // Stop any existing animation
    stopAnimation();

    const map = viewer.map;
    if (!map || viewer.isDestroyed()) return;

    // Get source and target coordinates
    const sourceGeom = source.geometry;
    const targetGeom = target.geometry;

    if (sourceGeom.type !== "Point" || targetGeom.type !== "Point") {
      console.warn("Target animation requires Point geometries");
      return;
    }

    const startCoords = sourceGeom.coordinates as [number, number];
    const endCoords = targetGeom.coordinates as [number, number];

    // Create data manager
    const dataManager = createMapLibreDataManager(viewer);
    dataManagerRef.current = dataManager;
    currentSourceRef.current = source;
    currentTargetRef.current = target;

    // Find the layer for this source
    let foundLayerId: string | null = null;
    for (const [layerId, features] of viewer.featureStore.entries()) {
      if (features.has(source.id)) {
        foundLayerId = layerId;
        break;
      }
    }

    if (!foundLayerId) {
      console.warn(`Could not find layer for source ${source.id}`);
      return;
    }

    layerIdRef.current = foundLayerId;

    // Mark entity as animated
    dataManager.startAnimation(source.id, foundLayerId);
    isAnimatingRef.current = true;

    const startTime = performance.now();

    const step = (time: number) => {
      if (!isAnimatingRef.current) return;
      if (!map || viewer.isDestroyed()) {
        stopAnimation();
        return;
      }

      const elapsed = time - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease-in-out interpolation
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate position
      const lon = startCoords[0] + (endCoords[0] - startCoords[0]) * eased;
      const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * eased;

      // Update position
      dataManager.setEntityPosition(source.id, lon, lat, undefined, foundLayerId || undefined);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        // Animation complete
        isAnimatingRef.current = false;
        rafIdRef.current = null;

        // Keep __animated flag so React doesn't overwrite the new position
        // The entity stays at the target location until explicitly reset

        // Notify completion
        if (onComplete && currentSourceRef.current && currentTargetRef.current) {
          onComplete(currentSourceRef.current, currentTargetRef.current);
        }

        currentSourceRef.current = null;
        currentTargetRef.current = null;
        layerIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [viewer, durationMs, onComplete, stopAnimation]);

  return {
    startTargetAnimation,
    stopAnimation,
    isAnimating: isAnimatingRef.current,
  };
}
