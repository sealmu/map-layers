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

    // Handle programmatic selection changes
    const handleSelectionChanged = (selectedEntity: Entity | undefined) => {
      if (selectedEntity && (onClick || onSelecting)) {
        // Get the position of the selected entity
        const position = selectedEntity.position?.getValue(viewer.clock.currentTime);
        if (position) {
          const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
          if (cartographic) {
            const location: MapClickLocation = {
              cartesian: position,
              cartographic,
              longitude: cartographic.longitude * 180 / Math.PI,
              latitude: cartographic.latitude * 180 / Math.PI,
              height: cartographic.height,
            };

            // Check with onSelecting callback if provided
            let selectionApproved = true;
            if (onSelecting) {
              selectionApproved = onSelecting(selectedEntity, location);
            }

            if (!selectionApproved) {
              // Selection not approved - clear it
              viewer.selectedEntity = undefined;
              return;
            }

            // Selection approved - call onClick if provided
            if (onClick) {
              const screenPosition = viewer.scene.cartesianToCanvasCoordinates(position);
              // Only call onClick if the entity is visible on screen
              if (screenPosition && screenPosition.x >= 0 && screenPosition.x <= viewer.canvas.clientWidth &&
                  screenPosition.y >= 0 && screenPosition.y <= viewer.canvas.clientHeight) {
                onClick(selectedEntity, location, screenPosition);
              }
            }
          }
        }
      }
    };

    // Listen for programmatic selection changes
    viewer.selectedEntityChanged.addEventListener(handleSelectionChanged);

    return () => {
      handler.destroy();
      viewer.selectedEntityChanged.removeEventListener(handleSelectionChanged);
    };
  }, [viewer, onClick, onSelecting]);
}
