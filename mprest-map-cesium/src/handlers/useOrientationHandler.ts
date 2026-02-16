import { useEffect, useRef } from "react";
import type { ICameraOrientation } from "@mprest/map-core";
import type { ViewerWithConfigs, RendererRegistry } from "../types";

const THRESHOLD = 0.0001; // ~0.006 degrees — avoid noisy updates

export interface UseOrientationHandlerOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R> | null;
  onOrientation?: (orientation: ICameraOrientation) => void;
}

/**
 * Hook that tracks camera orientation (heading, pitch, roll) via preRender.
 * Calls onOrientation when any value changes beyond the threshold.
 */
export function useOrientationHandler<
  R extends RendererRegistry = RendererRegistry,
>({ viewer, onOrientation }: UseOrientationHandlerOptions<R>): void {
  const onOrientationRef = useRef(onOrientation);
  onOrientationRef.current = onOrientation;

  useEffect(() => {
    if (!viewer) return;

    const camera = viewer.camera;
    let last = { heading: camera.heading, pitch: camera.pitch, roll: camera.roll };

    const onPreRender = () => {
      const h = camera.heading, p = camera.pitch, r = camera.roll;
      if (
        Math.abs(h - last.heading) > THRESHOLD ||
        Math.abs(p - last.pitch) > THRESHOLD ||
        Math.abs(r - last.roll) > THRESHOLD
      ) {
        last = { heading: h, pitch: p, roll: r };
        onOrientationRef.current?.(last);
      }
    };

    viewer.scene.preRender.addEventListener(onPreRender);
    return () => {
      viewer.scene.preRender.removeEventListener(onPreRender);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);
}
