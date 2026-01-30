import { useCallback, useEffect, useRef } from "react";
import { useClickHandler } from "./useClickHandler";
import { usePositionHandler } from "./usePositionHandler";
import type {
  ViewerWithConfigs,
  RendererRegistry,
  RenderTypeFromRegistry,
  MapClickLocation,
  EntityChangeStatus,
  BasePlugin,
  LayerData,
} from "../types";
import { Entity, Cartesian2 } from "cesium";
import { callAllSubscribers } from "@mprest/map-core";

function callPluginMethod(
  plugins: Record<string, BasePlugin>,
  methodName: keyof BasePlugin,
  ...args: unknown[]
): boolean {
  for (const plugin of Object.values(plugins)) {
    const method = plugin[methodName];
    if (typeof method === "function") {
      const result = (method as (...args: unknown[]) => unknown).apply(
        plugin,
        args,
      );
      if (result === false) {
        return false;
      }
    }
  }
  return true;
}

export interface BindHandlersOptions<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R> | null;
  // Prop callbacks to subscribe as initial subscribers
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
  onEntityCreating?: (
    options: Entity.ConstructorOptions,
    item: LayerData,
  ) => boolean | void;
  onEntityCreate?: (
    type: RenderTypeFromRegistry<RendererRegistry>,
    item: LayerData,
    renderers: RendererRegistry,
    layerId?: string,
  ) => Entity.ConstructorOptions | null;
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
  onEntityCreating,
  onEntityCreate,
}: BindHandlersOptions<R>): {
  processEntityChange?: (
    entity: Entity,
    status: EntityChangeStatus,
    collectionName: string,
  ) => void;
  processEntityCreating?: (
    options: Entity.ConstructorOptions,
    item: LayerData,
  ) => void;
  processEntityCreate?: (
    type: RenderTypeFromRegistry<R>,
    item: LayerData,
    renderers: R,
    layerId?: string,
  ) => Entity.ConstructorOptions | null;
} {
  // Track if callbacks have been subscribed to avoid duplicate subscriptions
  const subscribedRef = useRef(false);

  // Subscribe prop callbacks as initial subscribers (once when viewer is available)
  useEffect(() => {
    if (!viewer || subscribedRef.current) return;
    subscribedRef.current = true;

    if (onClick) {
      viewer.handlers.onClick.subscribe(onClick);
    }
    if (onSelecting) {
      viewer.handlers.onSelecting.subscribe(onSelecting);
    }
    if (onClickPrevented) {
      viewer.handlers.onClickPrevented.subscribe(onClickPrevented);
    }
    if (onSelected) {
      viewer.handlers.onSelected.subscribe(onSelected);
    }
    if (onChangePosition) {
      viewer.handlers.onChangePosition.subscribe(onChangePosition);
    }
    if (onEntityChange) {
      viewer.handlers.onEntityChange.subscribe(onEntityChange);
    }
    if (onEntityCreating) {
      viewer.handlers.onEntityCreating.subscribe(onEntityCreating);
    }
    if (onEntityCreate) {
      viewer.handlers.onEntityCreate.subscribe(onEntityCreate);
    }
  }, [viewer, onClick, onSelecting, onClickPrevented, onSelected, onChangePosition, onEntityChange, onEntityCreating, onEntityCreate]);

  useClickHandler({
    viewer,
    onClick: viewer
      ? (
          entity: Entity | null,
          location: MapClickLocation,
          screenPosition?: Cartesian2,
        ): boolean | void => {
          if (
            !callPluginMethod(
              viewer.plugins,
              "onClick",
              entity,
              location,
              screenPosition,
            )
          )
            return false;
          return callAllSubscribers(
            viewer.handlers.onClick,
            entity,
            location,
            screenPosition,
          );
        }
      : undefined,
    onSelecting: viewer
      ? (entity: Entity, location: MapClickLocation) => {
          if (
            !callPluginMethod(viewer.plugins, "onSelecting", entity, location)
          )
            return false;
          return callAllSubscribers(viewer.handlers.onSelecting, entity, location);
        }
      : undefined,
    onClickPrevented: viewer
      ? (entity: Entity, location: MapClickLocation) => {
          if (
            !callPluginMethod(
              viewer.plugins,
              "onClickPrevented",
              entity,
              location,
            )
          )
            return false;
          return callAllSubscribers(
            viewer.handlers.onClickPrevented,
            entity,
            location,
          );
        }
      : undefined,
    onSelected: viewer
      ? (
          entity: Entity | null,
          location?: MapClickLocation,
          screenPosition?: Cartesian2,
        ) => {
          if (
            !callPluginMethod(
              viewer.plugins,
              "onSelected",
              entity,
              location,
              screenPosition,
            )
          )
            return false;
          return callAllSubscribers(
            viewer.handlers.onSelected,
            entity,
            location,
            screenPosition,
          );
        }
      : undefined,
  });

  usePositionHandler({
    viewer,
    onChangePosition: viewer
      ? (location: MapClickLocation | null) => {
          if (!callPluginMethod(viewer.plugins, "onChangePosition", location))
            return false;
          return callAllSubscribers(viewer.handlers.onChangePosition, location);
        }
      : undefined,
  });

  // Create processEntityChange function
  const processEntityChange = useCallback(
    (entity: Entity, status: EntityChangeStatus, collectionName: string) => {
      if (
        viewer &&
        !callPluginMethod(
          viewer.plugins,
          "onEntityChange",
          entity,
          status,
          collectionName,
        )
      )
        return;
      if (viewer) {
        callAllSubscribers(
          viewer.handlers.onEntityChange,
          entity,
          status,
          collectionName,
        );
      }
    },
    [viewer],
  );

  // Create processEntityCreating function - calls all subscribers
  const processEntityCreating = useCallback(
    (options: Entity.ConstructorOptions, item: LayerData) => {
      if (viewer) {
        callAllSubscribers(viewer.handlers.onEntityCreating, options, item);
      }
    },
    [viewer],
  );

  // Create processEntityCreate function - first non-null result wins
  const processEntityCreate = useCallback(
    (
      type: RenderTypeFromRegistry<R>,
      item: LayerData,
      renderers: R,
      layerId?: string,
    ): Entity.ConstructorOptions | null => {
      if (viewer) {
        for (const callback of viewer.handlers.onEntityCreate.subscribers) {
          const result = callback(type, item, renderers, layerId);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    [viewer],
  );

  return { processEntityChange, processEntityCreating, processEntityCreate };
}
