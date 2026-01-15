import { useEffect } from "react";
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Entity,
} from "cesium";
import type { MapClickLocation, ViewerWithConfigs, RendererRegistry } from "../../../types";
import { handleMapClick } from "../utils";

export interface UseClickHandlerOptions<R extends RendererRegistry = RendererRegistry> {
  viewer: ViewerWithConfigs<R> | null;
  onClick?: (entity: Entity | null, location: MapClickLocation, screenPosition?: Cartesian2) => void;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean;
}

/**
 * Hook that sets up click and selection handling for the Cesium viewer
 * Disables Cesium's default selection and provides custom onClick/onSelecting callbacks
 */
export function useClickHandler<R extends RendererRegistry = RendererRegistry>({
  viewer,
  onClick,
  onSelecting,
}: UseClickHandlerOptions<R>): void {
  useEffect(() => {
    if (!viewer) return;

    // Disable Cesium's default selection behavior completely
    // We'll handle all selection logic ourselves
    viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Handle click events - we now control all selection
    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleMapClick({
        viewer,
        position: click.position,
        onSelecting,
        onClick,
      });
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, onClick, onSelecting]);
}
