import { createEventHandler } from "@mprest/map-core";
import { BasePlugin, type MapInstance, type MapClickLocation, type EventHandler, type MapLibreFeature } from "../types";

interface EntitySelectionActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
  startSelection: (feature: MapLibreFeature) => void;
  cancelSelection: () => void;
}

interface EntitySelectionEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: EventHandler<(...args: any[]) => any>;
  onEntitySource: EventHandler<(feature: MapLibreFeature) => boolean>;
  onEntityTarget: EventHandler<(feature: MapLibreFeature) => boolean>;
  onTargetSet: EventHandler<(source: MapLibreFeature, target: MapLibreFeature) => void>;
  onSelectionChanged: EventHandler<
    (isActive: boolean, sourceFeature?: MapLibreFeature) => void
  >;
}

export class EntitySelectionPlugin extends BasePlugin<
  EntitySelectionActions,
  EntitySelectionEvents
> {
  private selectionMode = false;
  private sourceFeature: MapLibreFeature | null = null;

  actions: EntitySelectionActions;
  events: EntitySelectionEvents;

  constructor(map: MapInstance) {
    super(map);
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
    console.log("EntitySelectionPlugin:", message);
  }

  startSelection(feature: MapLibreFeature) {
    this.sourceFeature = feature;
    this.selectionMode = true;
    this.onMessage(`Selection mode entered for ${feature.id}`);
    this.emitSelectionChanged();
  }

  cancelSelection() {
    this.selectionMode = false;
    this.sourceFeature = null;
    this.onMessage("Selection mode cancelled");
    this.emitSelectionChanged();
  }

  private emitSelectionChanged() {
    this.events.onSelectionChanged.subscribers.forEach((callback) =>
      callback(this.selectionMode, this.sourceFeature || undefined),
    );
  }

  onSelecting = (
    feature: MapLibreFeature,
    location: MapClickLocation,
  ): boolean | void => {
    void feature;
    void location;
    if (this.selectionMode) {
      // During selection mode, prevent any selection
      return false;
    }
    return true; // Allow selection when not in selection mode
  };

  onSelected = (
    feature: MapLibreFeature | null,
    location?: MapClickLocation,
  ): boolean | void => {
    void feature;
    void location;
    return true;
  };

  onClickPrevented = (
    feature: MapLibreFeature,
    location: MapClickLocation,
  ): boolean | void => {
    void location;

    // Check if this is a source feature - don't process as target
    const isSource = this.events.onEntitySource.subscribers.some(
      (callback) => callback(feature) === true,
    );

    // Handle target selection when in selection mode
    if (this.selectionMode) {
      // If we clicked on the source feature itself (or another source), ignore
      if (isSource) {
        // Don't cancel or process - just stay in selection mode
        return false;
      }

      // Check if feature is a valid target
      const targetResults = this.events.onEntityTarget.subscribers.map(
        (callback) => callback(feature),
      );
      if (targetResults.some((result) => result === true)) {
        if (this.sourceFeature) {
          // Valid target - finalize selection
          this.events.onTargetSet.subscribers.forEach((callback) =>
            callback(this.sourceFeature!, feature),
          );
          this.onMessage(`Target set: ${this.sourceFeature.id} -> ${feature.id}`);
        }
        this.selectionMode = false;
        this.sourceFeature = null;
        this.emitSelectionChanged();
      } else {
        // Invalid target - cancel selection
        this.onMessage(
          `Target ${feature.id} not acceptable, selection cancelled`,
        );
        this.selectionMode = false;
        this.sourceFeature = null;
        this.emitSelectionChanged();
      }
      return false; // Don't show popup during selection mode
    }

    // Not in selection mode - check if this is a source feature that was prevented
    if (isSource) {
      // It's a source feature, don't show popup (onClick already handled it)
      return false;
    }
    return true; // Allow popup for others
  };

  onClick = (
    feature: MapLibreFeature | null,
    location: MapClickLocation,
  ): boolean | void => {
    void location;

    // Handle empty space click during selection mode
    if (this.selectionMode && !feature) {
      this.onMessage("Clicked on empty space, cancelling selection");
      this.selectionMode = false;
      this.sourceFeature = null;
      this.emitSelectionChanged();
      return true;
    }

    // onClick is called first, before onSelecting check
    if (feature) {
      // Check if feature is a source - start selection mode
      const results = this.events.onEntitySource.subscribers.map((callback) =>
        callback(feature),
      );
      if (results.some((result) => result === true)) {
        this.startSelection(feature);
        return true; // Allow native selection to work
      }
    }
    return true; // Allow further processing
  };
}
