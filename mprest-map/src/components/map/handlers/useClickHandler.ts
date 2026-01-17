import { useEffect } from "react";
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Entity,
} from "cesium";
import type {
  MapClickLocation,
  ViewerWithConfigs,
  RendererRegistry,
} from "../../../types";
import { handleMapClick } from "../utils";

export interface UseClickHandlerOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R> | null;
  onClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => void;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean;
  onClickPrevented?: (entity: Entity, location: MapClickLocation) => void;
  onSelected?: (
    entity: Entity | null,
    location?: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => void;
}

/**
 * Hook that sets up click and selection handling for the Cesium viewer
 * Disables Cesium's default selection and provides custom onClick/onSelecting callbacks
 */
export function useClickHandler<R extends RendererRegistry = RendererRegistry>({
  viewer,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
}: UseClickHandlerOptions<R>): void {
  useEffect(() => {
    if (!viewer) return;

    // Override selectedEntity to intercept programmatic selections
    let _selectedEntity = viewer.selectedEntity;
    Object.defineProperty(viewer, "selectedEntity", {
      get() {
        return _selectedEntity;
      },
      set(value: Entity | undefined) {
        if (value === _selectedEntity) return; // No change, don't call onSelected

        if (value && onSelecting) {
          // Get location for the entity
          const position = value.position?.getValue(viewer.clock.currentTime);
          let location: MapClickLocation | undefined;

          if (position) {
            const cartographic =
              viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
            if (cartographic) {
              location = {
                cartesian: position,
                cartographic,
                longitude: (cartographic.longitude * 180) / Math.PI,
                latitude: (cartographic.latitude * 180) / Math.PI,
                height: cartographic.height,
              };
            }
          } else {
            // For entities without a position property (e.g., polylines), create a dummy location
            location = {
              cartesian: Cartesian3.ZERO,
              cartographic: new Cartographic(0, 0, 0),
              longitude: 0,
              latitude: 0,
              height: 0,
            };
          }

          if (location && onSelecting(value, location)) {
            _selectedEntity = value;
            viewer.selectedEntityChanged.raiseEvent(value);
            if (onSelected) {
              // For programmatic selections, calculate screenPosition if possible
              let selectedScreenPosition: Cartesian2 | undefined;
              if (value.position) {
                const pos = value.position.getValue(viewer.clock.currentTime);
                if (pos) {
                  selectedScreenPosition =
                    viewer.scene.cartesianToCanvasCoordinates(pos);
                }
              }
              onSelected(value, location, selectedScreenPosition);
            }

            // Note: onClick is not called here for programmatic selections to avoid double calls
          } else {
            // Selection not approved - call onClickPrevented if provided
            if (onClickPrevented && location) {
              onClickPrevented(value, location);
            }
          }
        } else {
          _selectedEntity = value;
          viewer.selectedEntityChanged.raiseEvent(value);
          if (onSelected) onSelected(value ?? null, undefined, undefined);
        }
      },
    });

    // Disable Cesium's default selection behavior completely
    // We'll handle all selection logic ourselves
    viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
    );
    viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Handle click events - we now control all selection
    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleMapClick({
        viewer,
        position: click.position,
        onSelecting,
        onClick,
        onClickPrevented,
      });
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [viewer, onClick, onSelecting, onClickPrevented, onSelected]);
}
