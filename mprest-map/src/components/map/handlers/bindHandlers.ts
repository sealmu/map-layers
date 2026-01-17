import { useClickHandler } from "./useClickHandler";
import { usePositionHandler } from "./usePositionHandler";
import type {
  ViewerWithConfigs,
  RendererRegistry,
  MapClickLocation,
} from "../../../types";
import { Entity, Cartesian2 } from "cesium";
import { callAllSubscribers } from "../utils/EventHandler";

export interface BindHandlersOptions<R extends RendererRegistry = RendererRegistry> {
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
  onChangePosition?: (location: MapClickLocation | null) => void;
}

/**
 * Hook that binds all event handlers to the Cesium viewer
 * Sets up click handling, selection interception, and position tracking
 */
export function useBindHandlers<R extends RendererRegistry = RendererRegistry>({
  viewer,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onChangePosition,
}: BindHandlersOptions<R>): void {
  useClickHandler({
    viewer,
    onClick: viewer ? ((entity: Entity | null, location: MapClickLocation, screenPosition?: Cartesian2) => {
      onClick?.(entity, location, screenPosition);
      callAllSubscribers(viewer.handlers.onClick, entity, location, screenPosition);
    }) : onClick,
    onSelecting: viewer ? ((entity: Entity, location: MapClickLocation) => {
      return onSelecting?.(entity, location) ?? true;
    }) : onSelecting,
    onClickPrevented: viewer ? ((entity: Entity, location: MapClickLocation) => {
      onClickPrevented?.(entity, location);
      callAllSubscribers(viewer.handlers.onClickPrevented, entity, location);
    }) : onClickPrevented,
    onSelected: viewer ? ((entity: Entity | null, location?: MapClickLocation, screenPosition?: Cartesian2) => {
      onSelected?.(entity, location, screenPosition);
      callAllSubscribers(viewer.handlers.onSelected, entity, location, screenPosition);
    }) : onSelected,
  });

  usePositionHandler({
    viewer,
    onChangePosition: viewer ? ((location: MapClickLocation | null) => {
      onChangePosition?.(location);
      callAllSubscribers(viewer.handlers.onChangePosition, location);
    }) : onChangePosition,
  });
}