import {
  Cartesian2,
  Cartographic,
  Entity,
  defined,
  Math as CesiumMath,
} from "cesium";
import type { MapClickLocation, ViewerWithConfigs, RendererRegistry } from "../../../types";
import { getLocationFromPosition } from "./getLocationFromPosition";

export interface HandleMapClickOptions<R extends RendererRegistry = RendererRegistry> {
  viewer: ViewerWithConfigs<R>;
  position: Cartesian2;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean;
  onClick?: (entity: Entity | null, location: MapClickLocation) => void;
}

/**
 * Handles map click events with selection interception
 * @param options - Click handling options including viewer, position, and callbacks
 */
export function handleMapClick<R extends RendererRegistry = RendererRegistry>({
  viewer,
  position,
  onSelecting,
  onClick,
}: HandleMapClickOptions<R>): void {
  const location = getLocationFromPosition(viewer, position);
  const pickedObject = viewer.scene.pick(position);
  const pickedEntity: Entity | null = defined(pickedObject) && pickedObject.id ? pickedObject.id : null;

  // Track whether the entity was approved for selection
  let approvedEntity: Entity | null = null;

  // Handle selection logic
  if (pickedEntity) {
    if (onSelecting) {
      // Get entity position for the location parameter
      const entityPosition = pickedEntity.position?.getValue(viewer.clock.currentTime);
      let entityLocation: MapClickLocation | null = null;

      if (entityPosition) {
        const cartographic = Cartographic.fromCartesian(entityPosition);
        entityLocation = {
          cartesian: entityPosition,
          cartographic,
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height,
        };
      } else if (location) {
        // Fallback to click location if entity has no position
        entityLocation = location;
      }

      if (entityLocation) {
        const shouldSelect = onSelecting(pickedEntity, entityLocation);
        if (shouldSelect) {
          // Selection approved - manually set selected entity
          viewer.selectedEntity = pickedEntity;
          approvedEntity = pickedEntity;
        }
        // If shouldSelect is false, do nothing - selection is completely blocked
      }
    } else {
      // No onSelecting callback - allow selection
      viewer.selectedEntity = pickedEntity;
      approvedEntity = pickedEntity;
    }
  } else {
    // Clicked on empty space - deselect
    viewer.selectedEntity = undefined;
  }

  // Call onClick callback if provided - only pass approved entity
  if (onClick && location) {
    onClick(approvedEntity, location);
  }
}
