import { Entity, Cartesian2, Cartographic, Math as CesiumMath } from "cesium";
import { BasePlugin, createEventHandler } from "@mprest/map";
import type {
  CesiumMapApi,
  MapClickLocation,
  EventHandler,
  EntityChangeStatus,
} from "@mprest/map";

export interface StickyEntityInfo {
  entity: Entity;
  location?: MapClickLocation;
  screenPosition?: Cartesian2;
}

interface StickyInfoActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
  closeInfo: (entityId: string) => void;
  closeAll: () => void;
}

interface StickyInfoEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: EventHandler<(...args: any[]) => any>;
  onEntitySource: EventHandler<(entity: Entity) => boolean>;
  onRender: EventHandler<
    (info: StickyEntityInfo | null, entityId: string) => void
  >;
}

export class StickyInfoPlugin extends BasePlugin<
  StickyInfoActions,
  StickyInfoEvents
> {
  // Track multiple entities
  private trackedEntities: Map<string, Entity> = new Map();
  private unsubscribeEntityChange: (() => void) | null = null;

  actions: StickyInfoActions;
  events: StickyInfoEvents;

  constructor(api: CesiumMapApi) {
    super(api);
    this.actions = {
      closeInfo: this.closeInfo.bind(this),
      closeAll: this.closeAll.bind(this),
    };
    this.events = {
      onEntitySource: createEventHandler(),
      onRender: createEventHandler(),
    };
  }

  private closeInfo(entityId: string) {
    if (this.trackedEntities.has(entityId)) {
      this.trackedEntities.delete(entityId);
      this.emitRender(null, entityId);

      // If no more tracked entities, unsubscribe from changes
      if (this.trackedEntities.size === 0) {
        this.unsubscribeFromEntityChanges();
      }
    }
  }

  private closeAll() {
    this.trackedEntities.forEach((_, entityId) => {
      this.emitRender(null, entityId);
    });
    this.trackedEntities.clear();
    this.unsubscribeFromEntityChanges();
  }

  private emitRender(info: StickyEntityInfo | null, entityId: string) {
    this.events.onRender.subscribers.forEach((callback) =>
      callback(info, entityId),
    );
  }

  private subscribeToEntityChanges() {
    if (this.unsubscribeEntityChange) return;

    this.unsubscribeEntityChange =
      this.api.viewer.handlers.onEntityChange.subscribe(
        (entity: Entity, status: EntityChangeStatus) => {
          const entityId = entity.id?.toString() ?? "";
          if (status === "changed" && this.trackedEntities.has(entityId)) {
            // Entity position changed, update the info
            this.updateEntityInfo(entity);
          }
        },
      );
  }

  private unsubscribeFromEntityChanges() {
    if (this.unsubscribeEntityChange) {
      this.unsubscribeEntityChange();
      this.unsubscribeEntityChange = null;
    }
  }

  private updateEntityInfo(entity: Entity) {
    const entityId = entity.id?.toString() ?? "";
    if (!this.trackedEntities.has(entityId)) return;

    const position = entity.position?.getValue(
      this.api.viewer.clock.currentTime,
    );
    if (!position) return;

    // Convert Cartesian3 to screen position
    const screenPosition =
      this.api.viewer.scene.cartesianToCanvasCoordinates(position);
    if (!screenPosition) return;

    // Get location info
    const cartographic = Cartographic.fromCartesian(position);
    const location: MapClickLocation = {
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      height: cartographic.height,
      cartesian: position,
      cartographic,
    };

    this.emitRender(
      {
        entity,
        location,
        screenPosition,
      },
      entityId,
    );
  }

  onSelecting = (
    entity: Entity,
    location: MapClickLocation,
  ): boolean | void => {
    // Check if entity should be selected for sticky info
    const results = this.events.onEntitySource.subscribers.map((callback) =>
      callback(entity),
    );
    if (results.some((result) => result === true)) {
      const entityId = entity.id?.toString() ?? "";

      // Add to tracked entities
      this.trackedEntities.set(entityId, entity);

      // Subscribe to entity changes if not already
      this.subscribeToEntityChanges();

      // Get screen position
      const screenPosition = this.api.viewer.scene.cartesianToCanvasCoordinates(
        location.cartesian,
      );

      // Emit render event with entity info
      this.emitRender(
        {
          entity,
          location,
          screenPosition,
        },
        entityId,
      );

      // Return true to allow selection
      return true;
    }
    return; // Let other handlers decide
  };
}
