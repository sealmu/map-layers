import { useState, useLayoutEffect, useRef, type FC, type ReactNode } from "react";
import type { ICameraOrientation } from "@mprest/map-core";
import { useViewer } from "@mprest/map-core";
import type { ViewerWithConfigs } from "../../../types";
import { OrientationGaugeRenderer } from "./OrientationGaugeRenderer";

export interface OrientationGaugeViewProps {
  onRender?: (
    orientation: ICameraOrientation,
    defaultContent: ReactNode,
  ) => ReactNode;
}

const THRESHOLD = 0.001;

// This component is self-contained — it reads the camera from viewer context
// and polls via requestAnimationFrame. No plugin indirection needed.
export function createOrientationGaugeView(): FC<OrientationGaugeViewProps> {
  return function OrientationGaugeView({ onRender }) {
    const { viewer: rawViewer } = useViewer();
    const viewer = rawViewer as ViewerWithConfigs | null;

    const [orientation, setOrientation] = useState<ICameraOrientation | null>(
      null,
    );
    const lastRef = useRef<ICameraOrientation | null>(null);

    useLayoutEffect(() => {
      if (!viewer) return;

      const camera = viewer.camera;

      // Read once immediately
      const initial: ICameraOrientation = {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      };
      lastRef.current = initial;
      setOrientation(initial);

      let rafId: number;

      const loop = () => {
        const h = camera.heading;
        const p = camera.pitch;
        const r = camera.roll;
        const prev = lastRef.current!;

        if (
          Math.abs(h - prev.heading) > THRESHOLD ||
          Math.abs(p - prev.pitch) > THRESHOLD ||
          Math.abs(r - prev.roll) > THRESHOLD
        ) {
          const next: ICameraOrientation = {
            heading: h,
            pitch: p,
            roll: r,
          };
          lastRef.current = next;
          setOrientation(next);
        }

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    }, [viewer]);

    if (!orientation) return null;

    const defaultContent = (
      <OrientationGaugeRenderer orientation={orientation} />
    );

    if (onRender) {
      return <>{onRender(orientation, defaultContent)}</>;
    }

    return defaultContent;
  };
}
