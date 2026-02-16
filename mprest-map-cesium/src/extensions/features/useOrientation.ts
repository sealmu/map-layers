import { useState, useEffect, useMemo, useRef } from "react";
import { Math as CesiumMath } from "cesium";
import { useViewer, createEventHandler } from "@mprest/map-core";
import type {
  ExtensionModule,
  ExtensionContext,
  ViewerWithConfigs,
  IEventHandler,
} from "../../types";
import type { ICameraOrientation } from "@mprest/map-core";

// ============================================
// Types
// ============================================

export interface OrientationApi {
  /** Current camera orientation (heading, pitch, roll in radians) */
  orientation: ICameraOrientation;
  /** Event fired when camera orientation changes */
  onOrientation: IEventHandler<(orientation: ICameraOrientation) => void>;
}

// ============================================
// Helpers
// ============================================

const THRESHOLD = 0.0001; // ~0.006 degrees — avoid noisy updates

function orientationChanged(
  a: ICameraOrientation,
  b: ICameraOrientation,
): boolean {
  return (
    Math.abs(a.heading - b.heading) > THRESHOLD ||
    Math.abs(a.pitch - b.pitch) > THRESHOLD ||
    Math.abs(a.roll - b.roll) > THRESHOLD
  );
}

const DEFAULT_ORIENTATION: ICameraOrientation = {
  heading: 0,
  pitch: CesiumMath.toRadians(-90),
  roll: 0,
};

// ============================================
// NOOP API
// ============================================

const NOOP_API: OrientationApi = {
  orientation: DEFAULT_ORIENTATION,
  onOrientation: createEventHandler(),
};

// ============================================
// Extension Hook
// ============================================

const useOrientation = (_ctx: ExtensionContext): OrientationApi => {
  const { viewer } = useViewer();
  const cesiumViewer = viewer as unknown as ViewerWithConfigs | null;

  const [orientation, setOrientation] =
    useState<ICameraOrientation>(DEFAULT_ORIENTATION);
  const lastRef = useRef<ICameraOrientation>(DEFAULT_ORIENTATION);

  const onOrientationHandler = useMemo(
    () => createEventHandler<(orientation: ICameraOrientation) => void>(),
    [],
  );

  // Fire extension's onOrientation event when orientation changes
  useEffect(() => {
    onOrientationHandler.subscribers.forEach((cb) => cb(orientation));
  }, [orientation, onOrientationHandler]);

  // Listen to scene preRender to track camera orientation
  useEffect(() => {
    if (!cesiumViewer) return;

    const camera = cesiumViewer.camera;
    const onPreRender = () => {
      const current: ICameraOrientation = {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      };

      if (orientationChanged(lastRef.current, current)) {
        lastRef.current = current;
        setOrientation(current);
      }
    };

    cesiumViewer.scene.preRender.addEventListener(onPreRender);
    return () => {
      cesiumViewer.scene.preRender.removeEventListener(onPreRender);
    };
  }, [cesiumViewer]);

  return useMemo(
    () =>
      cesiumViewer
        ? {
            orientation,
            onOrientation: onOrientationHandler,
          }
        : NOOP_API,
    [cesiumViewer, orientation, onOrientationHandler],
  );
};

// ============================================
// Extension Definition
// ============================================

const orientationExtension: ExtensionModule<OrientationApi> = {
  name: "orientation",
  useExtension: useOrientation,
  priority: 2,
};

// Type augmentation
declare module "../../types" {
  interface MapApi {
    orientation?: OrientationApi;
  }
}

export default orientationExtension;
