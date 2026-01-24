import { useEffect, useCallback, useState, useRef } from "react";
import { Cartesian3, Cartographic, Entity } from "cesium";
import { DataManager } from "@mprest/map";
import type { ViewerWithConfigs } from "@mprest/map";

export interface DroneTargetAnimationState {
  isAnimating: boolean;
  progress: number;
  sourceId: string | null;
  targetId: string | null;
}

export interface DroneTargetAnimationControls {
  startAnimation: (source: Entity, target: Entity) => void;
  stopAnimation: () => void;
}

export interface UseDroneTargetAnimationResult {
  state: DroneTargetAnimationState;
  controls: DroneTargetAnimationControls;
}

export interface DroneTargetAnimationConfig {
  durationMs?: number;
  onComplete?: (sourceId: string, targetId: string) => void;
  stoppingDistanceMeters?: number;
}

export function useDroneTargetAnimation(
  viewer: ViewerWithConfigs | null,
  config: DroneTargetAnimationConfig = {},
): UseDroneTargetAnimationResult {
  const {
    durationMs = 5000,
    onComplete,
    stoppingDistanceMeters = 100,
  } = config;

  const [state, setState] = useState<DroneTargetAnimationState>({
    isAnimating: false,
    progress: 0,
    sourceId: null,
    targetId: null,
  });

  const animationRef = useRef<{
    rafId: number | null;
    startTime: number;
    startPosition: Cartesian3;
    targetPosition: Cartesian3;
    sourceId: string;
    targetId: string;
  } | null>(null);

  const stopAnimation = useCallback(() => {
    if (animationRef.current?.rafId) {
      cancelAnimationFrame(animationRef.current.rafId);
    }
    animationRef.current = null;
    setState({
      isAnimating: false,
      progress: 0,
      sourceId: null,
      targetId: null,
    });
  }, []);

  const startAnimation = useCallback(
    (source: Entity, target: Entity) => {
      if (!viewer) return;

      // Stop any existing animation
      if (animationRef.current?.rafId) {
        cancelAnimationFrame(animationRef.current.rafId);
      }

      const sourcePosition = source.position?.getValue(viewer.clock.currentTime);
      const targetPosition = target.position?.getValue(viewer.clock.currentTime);

      if (!sourcePosition || !targetPosition) {
        console.warn("Could not get positions for animation");
        return;
      }

      const sourceId = source.id?.toString() || "unknown";
      const targetId = target.id?.toString() || "unknown";

      animationRef.current = {
        rafId: null,
        startTime: performance.now(),
        startPosition: sourcePosition.clone(),
        targetPosition: targetPosition.clone(),
        sourceId,
        targetId,
      };

      setState({
        isAnimating: true,
        progress: 0,
        sourceId,
        targetId,
      });

      const dataManager = new DataManager(viewer);

      const animate = (time: number) => {
        if (!animationRef.current) return;

        const elapsed = time - animationRef.current.startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Get current source entity (it might have been updated)
        const currentSource = dataManager.getItem(animationRef.current.sourceId);
        if (!currentSource) {
          // Entity removed, stop animation
          stopAnimation();
          return;
        }

        // Interpolate position
        const startCarto = Cartographic.fromCartesian(animationRef.current.startPosition);
        const targetCarto = Cartographic.fromCartesian(animationRef.current.targetPosition);

        const newLon = startCarto.longitude + (targetCarto.longitude - startCarto.longitude) * progress;
        const newLat = startCarto.latitude + (targetCarto.latitude - startCarto.latitude) * progress;
        const newAlt = startCarto.height + (targetCarto.height - startCarto.height) * progress;

        const newPosition = Cartesian3.fromRadians(newLon, newLat, newAlt);

        // Check distance to target
        const distance = Cartesian3.distance(newPosition, animationRef.current.targetPosition);

        // Update entity position
        dataManager.updateItem(currentSource, {
          position: newPosition,
        });

        // Update state
        setState((prev) => ({
          ...prev,
          progress,
        }));

        // Check if animation should stop
        if (progress >= 1 || distance <= stoppingDistanceMeters) {
          const { sourceId, targetId } = animationRef.current;
          stopAnimation();
          onComplete?.(sourceId, targetId);
          return;
        }

        animationRef.current.rafId = requestAnimationFrame(animate);
      };

      animationRef.current.rafId = requestAnimationFrame(animate);
    },
    [viewer, durationMs, stoppingDistanceMeters, onComplete, stopAnimation],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current?.rafId) {
        cancelAnimationFrame(animationRef.current.rafId);
      }
    };
  }, []);

  return {
    state,
    controls: {
      startAnimation,
      stopAnimation,
    },
  };
}
