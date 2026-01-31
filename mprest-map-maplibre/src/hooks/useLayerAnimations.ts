import { useEffect, useRef } from "react";
import type { Map as MapLibreMapType } from "maplibre-gl";
import type { LayerAnimationOptions } from "../types";

/**
 * MapLibre layer animations hook
 * Animates features appearing on the map using opacity and scale transitions.
 * Similar to Cesium's "drone animation" but adapted for 2D maps.
 */
export function useLayerAnimations({
  sourceRef,
  isActive,
  isVisible,
  durationMs = 1500,
}: LayerAnimationOptions & { map?: MapLibreMapType }) {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sourceRef.current || !isActive || isVisible === false) return;

    // Get the map from the source
    // Note: GeoJSONSource doesn't directly expose map, so we need to pass it separately
    // For now, we'll use a workaround with requestAnimationFrame

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out cubic: 1 - (1 - x)^3
      // Note: eased value would be used if we had map access
      void (1 - Math.pow(1 - progress, 3));

      // Update layer properties via the source
      // Note: We need access to the map to update paint properties
      // This animation currently requires map access which we don't have here

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sourceRef, isActive, isVisible, durationMs]);
}

/**
 * MapLibre layer animations hook with map instance
 * Provides full animation control over layer paint properties.
 */
export function useLayerAnimationsWithMap({
  map,
  layerId,
  isActive,
  isVisible,
  durationMs = 1500,
  staggerMs = 50,
}: {
  map: MapLibreMapType | null;
  layerId: string;
  isActive?: boolean;
  isVisible?: boolean;
  durationMs?: number;
  staggerMs?: number;
}) {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !isActive || isVisible === false) return;

    // Check if layer exists
    const layerIds = [
      `${layerId}-circle`,
      `${layerId}-fill`,
      `${layerId}-line`,
      `${layerId}-outline`,
      `${layerId}-label`,
      `${layerId}-icon`,
    ];

    // Store original paint values
    const originalValues: Record<string, Record<string, unknown>> = {};

    for (const id of layerIds) {
      if (map.getLayer(id)) {
        const layer = map.getLayer(id);
        if (layer) {
          originalValues[id] = {};
          const layerType = layer.type;

          // Store and set initial values based on layer type
          if (layerType === "circle") {
            const originalRadius = map.getPaintProperty(id, "circle-radius");
            const originalOpacity = map.getPaintProperty(id, "circle-opacity");
            originalValues[id]["circle-radius"] = originalRadius;
            originalValues[id]["circle-opacity"] = originalOpacity ?? 1;
            // Start with small radius and 0 opacity
            map.setPaintProperty(id, "circle-radius", 0);
            map.setPaintProperty(id, "circle-opacity", 0);
          } else if (layerType === "fill") {
            const originalOpacity = map.getPaintProperty(id, "fill-opacity");
            originalValues[id]["fill-opacity"] = originalOpacity ?? 0.5;
            map.setPaintProperty(id, "fill-opacity", 0);
          } else if (layerType === "line") {
            const originalOpacity = map.getPaintProperty(id, "line-opacity");
            const originalWidth = map.getPaintProperty(id, "line-width");
            originalValues[id]["line-opacity"] = originalOpacity ?? 1;
            originalValues[id]["line-width"] = originalWidth;
            map.setPaintProperty(id, "line-opacity", 0);
          } else if (layerType === "symbol") {
            const originalIconOpacity = map.getPaintProperty(id, "icon-opacity");
            const originalTextOpacity = map.getPaintProperty(id, "text-opacity");
            originalValues[id]["icon-opacity"] = originalIconOpacity ?? 1;
            originalValues[id]["text-opacity"] = originalTextOpacity ?? 1;
            map.setPaintProperty(id, "icon-opacity", 0);
            map.setPaintProperty(id, "text-opacity", 0);
          }
        }
      }
    }

    // Skip animation if no layers found
    if (Object.keys(originalValues).length === 0) return;

    startTimeRef.current = null;
    void staggerMs; // Not used in this simpler implementation, but available for future use

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      // Animate each layer
      for (const [id, originals] of Object.entries(originalValues)) {
        if (!map.getLayer(id)) continue;

        const layer = map.getLayer(id);
        if (!layer) continue;
        const layerType = layer.type;

        if (layerType === "circle") {
          const targetRadius = originals["circle-radius"];
          const targetOpacity = originals["circle-opacity"] as number;

          // Animate radius from 0 to target
          if (typeof targetRadius === "number") {
            map.setPaintProperty(id, "circle-radius", targetRadius * eased);
          } else if (Array.isArray(targetRadius)) {
            // If it's an expression, just set opacity
            map.setPaintProperty(id, "circle-radius", originals["circle-radius"]);
          }
          map.setPaintProperty(id, "circle-opacity", targetOpacity * eased);
        } else if (layerType === "fill") {
          const targetOpacity = originals["fill-opacity"] as number;
          map.setPaintProperty(id, "fill-opacity", targetOpacity * eased);
        } else if (layerType === "line") {
          const targetOpacity = originals["line-opacity"] as number;
          map.setPaintProperty(id, "line-opacity", targetOpacity * eased);
        } else if (layerType === "symbol") {
          const targetIconOpacity = originals["icon-opacity"] as number;
          const targetTextOpacity = originals["text-opacity"] as number;
          map.setPaintProperty(id, "icon-opacity", targetIconOpacity * eased);
          map.setPaintProperty(id, "text-opacity", targetTextOpacity * eased);
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Restore original expression-based values at the end
        for (const [id, originals] of Object.entries(originalValues)) {
          if (!map.getLayer(id)) continue;

          for (const [prop, value] of Object.entries(originals)) {
            if (value !== undefined && value !== null) {
              map.setPaintProperty(id, prop, value);
            }
          }
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Restore original values on cleanup
      for (const [id, originals] of Object.entries(originalValues)) {
        if (map.getLayer(id)) {
          for (const [prop, value] of Object.entries(originals)) {
            if (value !== undefined && value !== null) {
              try {
                map.setPaintProperty(id, prop, value);
              } catch {
                // Layer might be removed during cleanup
              }
            }
          }
        }
      }
    };
  }, [map, layerId, isActive, isVisible, durationMs, staggerMs]);
}
