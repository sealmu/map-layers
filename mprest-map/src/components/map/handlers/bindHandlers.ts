import { useCallback } from "react";
import { useClickHandler } from "./useClickHandler";
import { usePositionHandler } from "./usePositionHandler";
import type {
  ViewerWithConfigs,
  RendererRegistry,
  MapClickLocation,
  EntityChangeStatus,
} from "../../../types";
import { Entity, Cartesian2 } from "cesium";
import { callAllSubscribers } from "../utils/EventHandler";

export interface BindHandlersOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R> | null;
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
  onSelected?: (
    entity: Entity | null,
    location?: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
  onEntityChange?: (
    entity: Entity,
    status: EntityChangeStatus,
    collectionName: string,
  ) => boolean | void;
}

/**
 * Hook that binds all event handlers to the Cesium viewer
 * Sets up click handling, selection interception, and position tracking
 * Returns handlers object with processEntityChange function
 */
export function useBindHandlers<R extends RendererRegistry = RendererRegistry>({
  viewer,
  onClick,
  onSelecting,
  onClickPrevented,
  onSelected,
  onChangePosition,
  onEntityChange,
}: BindHandlersOptions<R>): {
  processEntityChange:
    | ((
        entity: Entity,
        status: EntityChangeStatus,
        collectionName: string,
      ) => void)
    | undefined;
} {
  useClickHandler({
    viewer,
    onClick: viewer
      ? (
          entity: Entity | null,
          location: MapClickLocation,
          screenPosition?: Cartesian2,
        ) => {
          const result = onClick?.(entity, location, screenPosition);
          if (result === false) return;
          callAllSubscribers(
            viewer.handlers.onClick,
            entity,
            location,
            screenPosition,
          );
        }
      : onClick,
    onSelecting: viewer
      ? (entity: Entity, location: MapClickLocation) => {
          const result = onSelecting?.(entity, location);
          if (result === false) return false;
          callAllSubscribers(viewer.handlers.onSelecting, entity, location);
          return true;
        }
      : onSelecting,
    onClickPrevented: viewer
      ? (entity: Entity, location: MapClickLocation) => {
          const result = onClickPrevented?.(entity, location);
          if (result === false) return;
          callAllSubscribers(
            viewer.handlers.onClickPrevented,
            entity,
            location,
          );
        }
      : onClickPrevented,
    onSelected: viewer
      ? (
          entity: Entity | null,
          location?: MapClickLocation,
          screenPosition?: Cartesian2,
        ) => {
          const result = onSelected?.(entity, location, screenPosition);
          if (result === false) return;
          callAllSubscribers(
            viewer.handlers.onSelected,
            entity,
            location,
            screenPosition,
          );
        }
      : onSelected,
  });

  usePositionHandler({
    viewer,
    onChangePosition: viewer
      ? (location: MapClickLocation | null) => {
          const result = onChangePosition?.(location);
          if (result === false) return;
          callAllSubscribers(viewer.handlers.onChangePosition, location);
        }
      : onChangePosition,
  });

  // Create processEntityChange function
  const processEntityChange = useCallback(
    (entity: Entity, status: EntityChangeStatus, collectionName: string) => {
      const result = onEntityChange?.(entity, status, collectionName);
      if (result === false) return;
      if (viewer) {
        callAllSubscribers(
          viewer.handlers.onEntityChange,
          entity,
          status,
          collectionName,
        );
      }
    },
    [viewer, onEntityChange],
  );

  return { processEntityChange };
}
