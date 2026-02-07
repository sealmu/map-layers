import { useEffect, useRef } from "react";
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
} from "cesium";
import type {
  MapClickLocation,
  ViewerWithConfigs,
  RendererRegistry,
} from "../types";

export interface UsePositionHandlerOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R> | null;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
}

/**
 * Hook that sets up position tracking for the Cesium viewer
 * Provides onChangePosition callback when mouse moves over the map
 */
export function usePositionHandler<
  R extends RendererRegistry = RendererRegistry,
>({ viewer, onChangePosition }: UsePositionHandlerOptions<R>): void {
  const onChangePositionRef = useRef(onChangePosition);
  onChangePositionRef.current = onChangePosition;

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Handle mouse move events for position tracking
    handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      if (!onChangePositionRef.current) return;

      const cartesian = viewer.camera.pickEllipsoid(
        movement.endPosition,
        viewer.scene.globe.ellipsoid,
      );

      if (cartesian) {
        const cartographic =
          viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const location: MapClickLocation = {
          cartesian,
          cartographic,
          longitude: (cartographic.longitude * 180) / Math.PI,
          latitude: (cartographic.latitude * 180) / Math.PI,
          height: cartographic.height,
        };
        onChangePositionRef.current(location);
      } else {
        onChangePositionRef.current(null);
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      handler.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);
}
