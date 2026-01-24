import { Entity, Cartesian2 } from "cesium";
import { BasePlugin, createEventHandler } from "@mprest/map";
import type { CesiumMapApi, MapClickLocation, EventHandler, PluginActions, PluginEvents } from "@mprest/map";

interface EntitySelectionActions extends PluginActions {
  startSelection: (entity: Entity) => void;
  cancelSelection: () => void;
}

interface EntitySelectionEvents extends PluginEvents {
  onEntitySource: EventHandler<(entity: Entity) => boolean>;
  onEntityTarget: EventHandler<(entity: Entity) => boolean>;
  onTargetSet: EventHandler<(source: Entity, target: Entity) => void>;
  onSelectionChanged: EventHandler<(isActive: boolean, sourceEntity?: Entity) => void>;
}

export class EntitySelectionPlugin extends BasePlugin<EntitySelectionActions, EntitySelectionEvents> {
  private selectionMode = false;
  private sourceEntity: Entity | null = null;

  actions: EntitySelectionActions;
  events: EntitySelectionEvents;

  constructor(api: CesiumMapApi) {
    super(api);
    this.actions = {
      startSelection: this.startSelection.bind(this),
      cancelSelection: this.cancelSelection.bind(this),
    };
    this.events = {
      onEntitySource: createEventHandler(),
      onEntityTarget: createEventHandler(),
      onTargetSet: createEventHandler(),
      onSelectionChanged: createEventHandler(),
    };
  }

  onMessage(message: string) {
    console.log('EntitySelectionPlugin:', message);
    // In a real app, this could show a toast or update UI
  }

  startSelection(entity: Entity) {
    this.sourceEntity = entity;
    this.selectionMode = true;
    this.onMessage(`Selection mode entered for ${entity.id}`);
    this.emitSelectionChanged();
  }

  cancelSelection() {
    this.selectionMode = false;
    this.sourceEntity = null;
    this.onMessage('Selection mode cancelled');
    this.emitSelectionChanged();
  }

  private emitSelectionChanged() {
    this.events.onSelectionChanged.subscribers.forEach(callback => 
      callback(this.selectionMode, this.sourceEntity || undefined)
    );
  }

  onSelecting = (
    entity: Entity,
    location: MapClickLocation,
  ): boolean | void => {
    void entity;
    void location;
    if (this.selectionMode) {
      // During selection mode, prevent any selection
      return false;
    }
    return true; // Allow selection when not in selection mode
  };

  onSelected = (
    entity: Entity | null,
    location?: MapClickLocation,
    screenPosition?: Cartesian2,
  ): boolean | void => {
    void entity;
    void location;
    void screenPosition;
    return true;
  };

  onClickPrevented = (
    entity: Entity,
    location: MapClickLocation,
  ): boolean | void => {
    void location;

    // Handle target selection when in selection mode
    if (this.selectionMode) {
      // Check if entity is a valid target
      const targetResults = this.events.onEntityTarget.subscribers.map(callback => callback(entity));
      if (targetResults.some(result => result === true)) {
        if (this.sourceEntity) {
          // Valid target - finalize selection
          this.events.onTargetSet.subscribers.forEach(callback => callback(this.sourceEntity!, entity));
          this.onMessage(`Target set: ${this.sourceEntity.id} -> ${entity.id}`);
        }
        this.selectionMode = false;
        this.sourceEntity = null;
        this.emitSelectionChanged();
      } else {
        // Invalid target - cancel selection
        this.onMessage(`Target ${entity.id} not acceptable, selection cancelled`);
        this.selectionMode = false;
        this.sourceEntity = null;
        this.emitSelectionChanged();
      }
      return false; // Don't show popup during selection mode
    }

    // Check if this is a source entity that was prevented
    const results = this.events.onEntitySource.subscribers.map(callback => callback(entity));
    if (results.some(result => result === true)) {
      // It's a source entity, don't show popup
      return false;
    }
    return true; // Allow popup for others
  };

  onClick = (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ): boolean | void => {
    void location;
    void screenPosition;

    // Handle empty space click during selection mode
    // (onSelecting is not called for empty space, so we handle it here)
    if (this.selectionMode && !entity) {
      this.onMessage('Clicked on empty space, cancelling selection');
      this.selectionMode = false;
      this.sourceEntity = null;
      this.emitSelectionChanged();
      // Return true to let handleMapClick continue and deselect naturally
      return true;
    }

    // Note: onClick with entity is only called when onSelecting returns true (not in selection mode)
    if (entity) {
      // Check if entity is a source - start selection mode
      const results = this.events.onEntitySource.subscribers.map(callback => callback(entity));
      if (results.some(result => result === true)) {
        this.startSelection(entity);
        return true; // Allow native selection to work
      }
    }
    return true; // Allow further processing
  };
}