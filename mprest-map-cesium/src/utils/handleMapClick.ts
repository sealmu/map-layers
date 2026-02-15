import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Entity,
  defined,
  Math as CesiumMath,
} from "cesium";
import type {
  MapClickLocation,
  ViewerWithConfigs,
  RendererRegistry,
} from "../types";
import { getLocationFromPosition } from "./getLocationFromPosition";
import { setBypassSelectingCheck } from "../handlers/useClickHandler";

export interface HandleMapClickOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R>;
  position: Cartesian2;
  onClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean | void;
  onClickPrevented?: (
    entity: Entity,
    location: MapClickLocation,
  ) => boolean | void;
}

/**
 * Handles map click events with selection interception
 * @param options - Click handling options including viewer, position, and callbacks
 */
export function handleMapClick<R extends RendererRegistry = RendererRegistry>({
  viewer,
  position,
  onClick,
  onSelecting,
  onClickPrevented,
}: HandleMapClickOptions<R>): void {
  const location = getLocationFromPosition(viewer, position);
  if (!location) {
    // Off-globe click — still notify onClick subscribers for deselection
    if (onClick) {
      const fallback: MapClickLocation = {
        cartesian: Cartesian3.ZERO,
        cartographic: new Cartographic(0, 0, 0),
        longitude: 0,
        latitude: 0,
        height: 0,
      };
      const result = onClick(null, fallback, undefined);
      if (result === false) return;
    }
    setBypassSelectingCheck(viewer, null);
    viewer.selectedEntity = undefined;
    return;
  }

  // Pick entity, skipping internal selection visuals (__ms_ prefix)
  let pickedEntity: Entity | null = null;
  const picks = viewer.scene.drillPick(position);
  for (const pick of picks) {
    if (defined(pick) && pick.id instanceof Entity) {
      if (typeof pick.id.id === "string" && pick.id.id.startsWith("__ms_")) continue;
      pickedEntity = pick.id;
      break;
    }
  }

  const screenPosition = viewer.scene.cartesianToCanvasCoordinates(
    location.cartesian,
  );

  // Check selection permission first
  if (pickedEntity && onSelecting) {
    // Get entity position for the location parameter
    const entityPosition = pickedEntity.position?.getValue(
      viewer.clock.currentTime,
    );
    let entityLocation: MapClickLocation = location;

    if (entityPosition) {
      const cartographic = Cartographic.fromCartesian(entityPosition);
      entityLocation = {
        cartesian: entityPosition,
        cartographic,
        longitude: CesiumMath.toDegrees(cartographic.longitude),
        latitude: CesiumMath.toDegrees(cartographic.latitude),
        height: cartographic.height,
      };
    }

    const shouldSelect = onSelecting(pickedEntity, entityLocation) !== false;
    if (!shouldSelect) {
      // Selection prevented - call onClickPrevented and skip onClick/selection
      if (onClickPrevented) {
        onClickPrevented(pickedEntity, entityLocation);
      }
      return;
    }
  }

  // Call onClick only when selection is allowed
  if (onClick) {
    const result = onClick(pickedEntity, location, screenPosition);
    if (result === false) {
      return;
    }
  }

  // Proceed with selection (bypass setter's onSelecting since we already checked)
  // Pass location and screenPosition through bypass data for onSelected
  setBypassSelectingCheck(viewer, { location, screenPosition });
  if (pickedEntity) {
    viewer.selectedEntity = pickedEntity;
  } else {
    // Clicked on empty space - deselect
    viewer.selectedEntity = undefined;
  }
}
