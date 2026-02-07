import { useEffect, useRef } from "react";
import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Entity,
  Viewer,
  defined,
} from "cesium";
import type {
  MapClickLocation,
  ViewerWithConfigs,
  RendererRegistry,
} from "../types";
import { handleMapClick, getLocationFromPosition } from "../utils";

// Track viewers that should bypass onSelecting check (set by handleMapClick)
// Stores location and screenPosition to pass through to onSelected
interface BypassData {
  location: MapClickLocation;
  screenPosition?: Cartesian2;
}
const bypassSelectingCheck = new WeakMap<Viewer, BypassData | null>();

export function setBypassSelectingCheck(
  viewer: Viewer,
  data: BypassData | null,
): void {
  bypassSelectingCheck.set(viewer, data);
}

function getAndResetBypassSelectingCheck(viewer: Viewer): BypassData | null {
  const value = bypassSelectingCheck.get(viewer) ?? null;
  bypassSelectingCheck.set(viewer, null);
  return value;
}

export interface UseClickHandlerOptions<
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
  onRightClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onDblClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onLeftDown?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onLeftUp?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onRightDown?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onRightUp?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
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
  onRightClick,
  onDblClick,
  onLeftDown,
  onLeftUp,
  onRightDown,
  onRightUp,
}: UseClickHandlerOptions<R>): void {
  // Store callbacks in refs so the effect doesn't re-run when they change
  const onClickRef = useRef(onClick);
  const onSelectingRef = useRef(onSelecting);
  const onClickPreventedRef = useRef(onClickPrevented);
  const onSelectedRef = useRef(onSelected);
  const onRightClickRef = useRef(onRightClick);
  const onDblClickRef = useRef(onDblClick);
  const onLeftDownRef = useRef(onLeftDown);
  const onLeftUpRef = useRef(onLeftUp);
  const onRightDownRef = useRef(onRightDown);
  const onRightUpRef = useRef(onRightUp);

  // Keep refs in sync with latest callbacks
  onClickRef.current = onClick;
  onSelectingRef.current = onSelecting;
  onClickPreventedRef.current = onClickPrevented;
  onSelectedRef.current = onSelected;
  onRightClickRef.current = onRightClick;
  onDblClickRef.current = onDblClick;
  onLeftDownRef.current = onLeftDown;
  onLeftUpRef.current = onLeftUp;
  onRightDownRef.current = onRightDown;
  onRightUpRef.current = onRightUp;

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

        // Skip onSelecting if called from handleMapClick (already checked there)
        const bypassData = getAndResetBypassSelectingCheck(viewer);

        if (value && onSelectingRef.current && !bypassData) {
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

          if (location && onSelectingRef.current(value, location)) {
            _selectedEntity = value;
            viewer.selectedEntityChanged.raiseEvent(value);
            if (onSelectedRef.current) {
              // For programmatic selections, calculate screenPosition if possible
              let selectedScreenPosition: Cartesian2 | undefined;
              if (value.position) {
                const pos = value.position.getValue(viewer.clock.currentTime);
                if (pos) {
                  selectedScreenPosition =
                    viewer.scene.cartesianToCanvasCoordinates(pos);
                }
              }
              onSelectedRef.current(value, location, selectedScreenPosition);
            }
            // Note: onClick is not called here for programmatic selections to avoid double calls
          } else {
            // Selection not approved - call onClickPrevented if provided
            if (onClickPreventedRef.current && location) {
              onClickPreventedRef.current(value, location);
            }
          }
        } else {
          _selectedEntity = value;
          viewer.selectedEntityChanged.raiseEvent(value);
          if (onSelectedRef.current) {
            onSelectedRef.current(
              value ?? null,
              bypassData?.location,
              bypassData?.screenPosition,
            );
          }
        }
      },
      configurable: true,
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
        onClick: (...args) => onClickRef.current?.(...args),
        onSelecting: (...args) => onSelectingRef.current?.(...args),
        onClickPrevented: (...args) => onClickPreventedRef.current?.(...args),
      });
    }, ScreenSpaceEventType.LEFT_CLICK);

    // Simple event handler: resolve location, pick entity, call ref callback
    const handleSimpleEvent = (
      position: Cartesian2,
      callbackRef: React.RefObject<
        | ((
            entity: Entity | null,
            location: MapClickLocation,
            screenPosition?: Cartesian2,
          ) => boolean | void)
        | undefined
      >,
    ) => {
      if (!callbackRef.current) return;
      const location = getLocationFromPosition(viewer, position);
      if (!location) return;
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
      callbackRef.current(pickedEntity, location, screenPosition);
    };

    // Register additional mouse event handlers
    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onRightClickRef);
    }, ScreenSpaceEventType.RIGHT_CLICK);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onDblClickRef);
    }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onLeftDownRef);
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onLeftUpRef);
    }, ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onRightDownRef);
    }, ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      handleSimpleEvent(click.position, onRightUpRef);
    }, ScreenSpaceEventType.RIGHT_UP);

    return () => {
      handler.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);
}
