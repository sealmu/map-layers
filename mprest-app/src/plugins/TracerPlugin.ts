import {
  Entity,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  CallbackProperty,
  ConstantProperty,
} from "cesium";
import { createEventHandler, type EntityChangeStatus } from "@mprest/map-core";
import {
  BasePlugin,
  DataManager,
  type MapInstance,
  type MapClickLocation,
  type EventHandler,
  type ViewerWithConfigs,
} from "@mprest/map-cesium";

// Trace coordinate with timestamp and animation state
export interface TraceCoordinate {
  id: string;
  position: Cartesian3;
  location: MapClickLocation;
  timestamp: number;
  fadeInProgress: number; // 0-1 for animation
  fadeOutProgress: number; // 0-1 for animation
  effectiveLifetime: number; // Fixed lifetime calculated at creation (ms)
  birthIndex: number; // Index in array when created (for color gradient)
}

// Trace data for a single entity
export interface EntityTrace {
  entityId: string;
  entity: Entity;
  coordinates: TraceCoordinate[];
  firstCoordTimestamp: number; // Fixed reference timestamp for fade calculations
}

// Plugin configuration options
export interface TracerPluginOptions {
  // === Core settings ===
  maxCoordinates?: number; // Max coordinates to keep in trace (default: 10)
  coordinateLifetime?: number; // How long each coordinate lives in ms (default: 60000)
  fadeInDuration?: number; // Fade in animation duration in ms (default: 300)
  fadeOutDuration?: number; // Fade out animation duration in ms (default: 500)

  // === Point appearance ===
  tracePointSize?: number; // Base size of trace points in pixels (default: 5)
  traceColor?: Color; // Legacy - base color (default: Color.CYAN)
  tailColor?: Color; // Color at tail/oldest point (default: Color.YELLOW)
  headColor?: Color; // Color at head/newest point (default: Color.ORANGE)

  // === Opacity settings ===
  tailAlpha?: number; // Alpha at tail (0-1, default: 0.04)
  headAlpha?: number; // Alpha at head (0-1, default: 0.12)

  // === Size scaling ===
  tailSizeRatio?: number; // Size ratio at tail (0-1, default: 0.1 = 10% of base)
  headSizeRatio?: number; // Size ratio at head (0-1, default: 1.0 = 100% of base)

  // === Throttling - point creation ===
  minPointDistance?: number; // Min distance (meters) between points (default: 500)
  minPointInterval?: number; // Min time (ms) between points (default: 5000)

  // === Removal timing ===
  removalIntervalMin?: number; // Fastest removal interval in ms (many points) (default: 100)
  removalIntervalMax?: number; // Slowest removal interval in ms (few points) (default: 2500)
  removalSlowdownThreshold?: number; // Point count threshold for slowdown (default: 20)
  removalSlowdownPower?: number; // Power curve for slowdown (default: 2)

  // === Update throttling ===
  colorUpdateInterval?: number; // How often to update colors/sizes in ms (default: 100)
}

interface TracerActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
  trace: (entity: Entity, options?: Partial<TracerPluginOptions>) => void;
  untrace: (entityId: string) => void;
  untraceAll: () => void;
  getTrace: (entityId: string) => EntityTrace | undefined;
}

interface TracerEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: EventHandler<(...args: any[]) => any>;
  onChange: EventHandler<(entityId: string, trace: EntityTrace | null) => void>;
}

const DEFAULT_OPTIONS: Required<TracerPluginOptions> = {
  // Core settings
  maxCoordinates: 10,
  coordinateLifetime: 60000, // 60 seconds - traces stay on map like breadcrumbs
  fadeInDuration: 300,
  fadeOutDuration: 500,

  // Point appearance
  tracePointSize: 5,
  traceColor: Color.CYAN, // Legacy
  tailColor: Color.YELLOW,
  headColor: Color.ORANGE,

  // Opacity
  tailAlpha: 0.04,
  headAlpha: 0.12,

  // Size scaling
  tailSizeRatio: 0.1, // 10% of base size
  headSizeRatio: 1.0, // 100% of base size

  // Throttling - point creation
  minPointDistance: 500, // meters
  minPointInterval: 5000, // ms

  // Removal timing
  removalIntervalMin: 100, // ms
  removalIntervalMax: 2500, // ms
  removalSlowdownThreshold: 20,
  removalSlowdownPower: 2,

  // Update throttling
  colorUpdateInterval: 100, // ms
};

const TRACE_ENTITY_PREFIX = "tracer-point-";

export class TracerPlugin extends BasePlugin<TracerActions, TracerEvents> {
  private trackedEntities: Map<string, EntityTrace> = new Map();
  private entityOptions: Map<string, Required<TracerPluginOptions>> = new Map();
  private animationFrameId: number | null = null;
  private coordinateTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  private defaultOptions: Required<TracerPluginOptions>;
  private isDestroyed = false;
  private dataManager: DataManager;
  private unsubscribeEntityChange: (() => void) | null = null;

  actions: TracerActions;
  events: TracerEvents;

  constructor(map: MapInstance, options?: TracerPluginOptions) {
    super(map);

    this.dataManager = new DataManager(map.viewer as unknown as ViewerWithConfigs);
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...options };

    this.actions = {
      trace: this.trace.bind(this),
      untrace: this.untrace.bind(this),
      untraceAll: this.untraceAll.bind(this),
      getTrace: this.getTrace.bind(this),
    };

    this.events = {
      onChange: createEventHandler(),
    };

    // Clean up any orphaned trace entities from previous mounts (deferred)
    this.scheduleOrphanCleanup();
  }

  // Check if safe to perform operations
  private isSafeToOperate(): boolean {
    if (this.isDestroyed) return false;
    try {
      return !this.map.viewer.isDestroyed();
    } catch {
      return false;
    }
  }

  // Schedule cleanup of orphaned trace entities
  private scheduleOrphanCleanup() {
    // Use setTimeout to defer cleanup after initial render
    setTimeout(() => {
      if (!this.isSafeToOperate()) return;

      try {
        const entities = this.map.viewer.entities;
        const toRemove: string[] = [];

        // Get all currently tracked coordinate IDs
        const trackedIds = new Set<string>();
        this.trackedEntities.forEach((trace) => {
          trace.coordinates.forEach((coord) => {
            trackedIds.add(coord.id);
          });
        });

        for (let i = 0; i < entities.values.length; i++) {
          const entity = entities.values[i];
          // Only remove if it has our prefix AND is not currently tracked
          if (
            entity.id?.startsWith(TRACE_ENTITY_PREFIX) &&
            !trackedIds.has(entity.id)
          ) {
            toRemove.push(entity.id);
          }
        }

        if (toRemove.length > 0) {
          toRemove.forEach((id) => {
            try {
              this.dataManager.removeItem(id);
            } catch {
              // Ignore errors
            }
          });
        }
      } catch {
        // Ignore errors during cleanup
      }
    }, 1000);
  }

  private trace(entity: Entity, options?: Partial<TracerPluginOptions>) {
    if (!this.isSafeToOperate()) return;

    const entityId = entity.id?.toString() ?? "";
    if (!entityId) return;

    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    this.entityOptions.set(entityId, mergedOptions);

    // Initialize trace if not exists
    if (!this.trackedEntities.has(entityId)) {
      // Start animation loop and subscribe to entity changes on first trace
      if (this.trackedEntities.size === 0) {
        this.startAnimationLoop();
        this.subscribeToEntityChanges();
      }

      const trace: EntityTrace = {
        entityId,
        entity,
        coordinates: [],
        firstCoordTimestamp: Date.now(),
      };
      this.trackedEntities.set(entityId, trace);

      // Add initial position
      this.addCoordinate(entity);

      this.emitChange(entityId, trace);
    }
  }

  private untrace(entityId: string) {
    const trace = this.trackedEntities.get(entityId);
    if (!trace) return;

    // Clear all coordinate timers for this entity
    trace.coordinates.forEach((coord) => {
      const timerId = this.coordinateTimers.get(coord.id);
      if (timerId) {
        clearTimeout(timerId);
        this.coordinateTimers.delete(coord.id);
      }
      // Remove visual entity
      if (this.isSafeToOperate()) {
        try {
          this.dataManager.removeItem(coord.id);
        } catch {
          // Ignore errors during cleanup
        }
      }
    });

    this.trackedEntities.delete(entityId);
    this.entityOptions.delete(entityId);
    this.lastRemovalTime.delete(entityId);

    // Stop animation loop and unsubscribe if no more entities
    if (this.trackedEntities.size === 0) {
      this.stopAnimationLoop();
      this.unsubscribeFromEntityChanges();
    }

    if (!this.isDestroyed) {
      this.emitChange(entityId, null);
    }
  }

  private untraceAll() {
    const entityIds = Array.from(this.trackedEntities.keys());
    entityIds.forEach((entityId) => this.untrace(entityId));
  }

  private getTrace(entityId: string): EntityTrace | undefined {
    return this.trackedEntities.get(entityId);
  }

  private emitChange(entityId: string, trace: EntityTrace | null) {
    this.events.onChange.subscribers.forEach((callback) =>
      callback(entityId, trace),
    );
  }

  private subscribeToEntityChanges() {
    if (this.unsubscribeEntityChange) return;

    this.unsubscribeEntityChange =
      this.map.viewer.handlers.onEntityChange.subscribe(
        (entity: Entity, status: EntityChangeStatus) => {
          const entityId = entity.id?.toString() ?? "";
          if (status === "changed" && this.trackedEntities.has(entityId)) {
            this.addCoordinate(entity);
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

  private addCoordinate(entity: Entity) {
    // Safety check
    if (!this.isSafeToOperate()) return;

    const entityId = entity.id?.toString() ?? "";
    const trace = this.trackedEntities.get(entityId);
    if (!trace) return;

    const options = this.entityOptions.get(entityId) ?? this.defaultOptions;

    // Get current position - use getValue() without time for ConstantPositionProperty
    let position: Cartesian3 | undefined;
    try {
      // First try without time (for ConstantPositionProperty)
      position = entity.position?.getValue();
      if (!position) {
        // Fallback to with clock time
        position = entity.position?.getValue(this.map.viewer.clock.currentTime);
      }
    } catch {
      return;
    }
    if (!position) return;

    // Throttle point creation by both distance AND time
    // This prevents dense accumulation when moving slowly
    if (trace.coordinates.length > 0) {
      const lastCoord = trace.coordinates[trace.coordinates.length - 1];
      const distance = Cartesian3.distance(lastCoord.position, position);
      const timeSinceLastPoint = Date.now() - lastCoord.timestamp;

      // Skip only if BOTH too close AND too soon
      // Add point if moved far enough OR waited long enough
      if (distance < options.minPointDistance && timeSinceLastPoint < options.minPointInterval) {
        return; // Skip - too close AND too soon
      }
    }

    // Create location info
    const cartographic = Cartographic.fromCartesian(position);
    const location: MapClickLocation = {
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      height: cartographic.height,
      cartesian: position,
      cartographic,
    };

    // Create coordinate entry with unique ID
    const coordId = `${TRACE_ENTITY_PREFIX}${entityId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Store the base lifetime - all points use the same lifetime
    // Sequential removal is handled by removing oldest first with staggered timing
    const effectiveLifetime = options.coordinateLifetime;
    const birthIndex = trace.coordinates.length;

    const coordinate: TraceCoordinate = {
      id: coordId,
      position: position.clone(),
      location,
      timestamp: Date.now(),
      fadeInProgress: 0,
      fadeOutProgress: 0,
      effectiveLifetime,
      birthIndex,
    };

    // Add to trace
    trace.coordinates.push(coordinate);

    // Create visual entity using point with dynamic color via CallbackProperty
    const trackedEntitiesRef = this.trackedEntities;
    const entityOptionsRef = this.entityOptions;
    const defaultOptionsRef = this.defaultOptions;

    // CallbackProperty for dynamic color based on position and age-based alpha
    const colorCallback = new CallbackProperty(() => {
      const currentTrace = trackedEntitiesRef.get(entityId);
      if (!currentTrace || currentTrace.coordinates.length === 0) {
        return Color.ORANGE;
      }

      const coord = currentTrace.coordinates.find((c) => c.id === coordId);
      if (!coord) {
        return Color.ORANGE;
      }

      // Get current options
      const opts = entityOptionsRef.get(entityId) ?? defaultOptionsRef;

      // Use array index for color gradient (dynamic - changes as points are removed)
      const index = currentTrace.coordinates.indexOf(coord);
      const count = currentTrace.coordinates.length;
      // relativePosition: 0 = tail (oldest in array), 1 = head (newest)
      const relativePosition = count > 1 ? index / (count - 1) : 1;

      // Color: lerp from tailColor to headColor
      const color = Color.lerp(
        opts.tailColor,
        opts.headColor,
        relativePosition,
        new Color(),
      );

      // Linear gradient - head visible, tail fades
      // relativePosition: 0=tail (oldest), 1=head (newest, near entity)
      color.alpha = opts.tailAlpha + (opts.headAlpha - opts.tailAlpha) * relativePosition;

      return color;
    }, false);

    const addedEntity = this.dataManager.addItem({
      id: coordId,
      position: coordinate.position, // Use the cloned position, not the original reference
      point: {
        pixelSize: options.tracePointSize,
        color: colorCallback,
        outlineWidth: 0,
        outlineColor: Color.TRANSPARENT,
        // No disableDepthTestDistance - trace points render behind other entities
      },
    });

    if (!addedEntity) {
      // Remove from trace array since visual creation failed
      trace.coordinates.pop();
      return;
    }

    // Set timer to start fade out after lifetime
    const fadeOutTimer = setTimeout(() => {
      this.startFadeOut(entityId, coordId);
    }, options.coordinateLifetime - options.fadeOutDuration);

    this.coordinateTimers.set(coordId, fadeOutTimer);

    // Check if we need to remove oldest coordinate
    if (trace.coordinates.length > options.maxCoordinates) {
      const oldest = trace.coordinates[0];
      // Cancel existing timer and start immediate fade out
      const existingTimer = this.coordinateTimers.get(oldest.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.coordinateTimers.delete(oldest.id);
      }
      this.startFadeOut(entityId, oldest.id);
    }

    this.emitChange(entityId, trace);
  }

  // Update all trace points size based on their index in the array
  // HEAD (newest, last in array) = full size
  // TAIL (oldest, first in array) = smaller size
  private updateTracePointSizes(entityId: string) {
    const trace = this.trackedEntities.get(entityId);
    if (!trace || trace.coordinates.length === 0) return;

    const options = this.entityOptions.get(entityId) ?? this.defaultOptions;
    const baseSize = options.tracePointSize;
    const count = trace.coordinates.length;

    trace.coordinates.forEach((coord, index) => {
      // Progress: 0 = tail (oldest), 1 = head (newest, near entity)
      const progress = index / Math.max(count - 1, 1);
      // Size: interpolate from tailSizeRatio to headSizeRatio
      const sizeRatio = options.tailSizeRatio + (options.headSizeRatio - options.tailSizeRatio) * progress;
      const size = baseSize * sizeRatio;

      const traceEntity = this.dataManager.getItem(coord.id);
      if (traceEntity?.point?.pixelSize) {
        (traceEntity.point.pixelSize as ConstantProperty).setValue(size);
      }
    });
  }

  private startFadeOut(entityId: string, coordId: string) {
    if (!this.isSafeToOperate()) return;

    const trace = this.trackedEntities.get(entityId);
    if (!trace) return;

    const coord = trace.coordinates.find((c) => c.id === coordId);
    if (!coord || coord.fadeOutProgress > 0) return; // Already fading out

    // Mark as starting fade out
    coord.fadeOutProgress = 0.001;

    // Set timer to remove after fade out completes
    const options = this.entityOptions.get(entityId) ?? this.defaultOptions;
    const removeTimer = setTimeout(() => {
      this.removeCoordinate(entityId, coordId);
    }, options.fadeOutDuration);

    this.coordinateTimers.set(`${coordId}-remove`, removeTimer);
  }

  private removeCoordinate(entityId: string, coordId: string) {
    // Safety check
    if (!this.isSafeToOperate()) return;

    const trace = this.trackedEntities.get(entityId);
    if (!trace) return;

    // Remove from trace array
    const index = trace.coordinates.findIndex((c) => c.id === coordId);
    if (index !== -1) {
      trace.coordinates.splice(index, 1);
    }

    // Remove visual entity
    try {
      this.dataManager.removeItem(coordId);
    } catch {
      // Ignore errors during removal
    }

    // Clean up timers
    this.coordinateTimers.delete(coordId);
    this.coordinateTimers.delete(`${coordId}-remove`);

    this.emitChange(entityId, trace);
  }

  private startAnimationLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.updateAnimations();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private stopAnimationLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private lastColorUpdateTime = 0;

  private updateAnimations() {
    // Update visual properties (sizes, cleanup) - position detection is event-based
    if (!this.isSafeToOperate()) return;

    const now = Date.now();

    this.trackedEntities.forEach((trace, entityId) => {
      const options = this.entityOptions.get(entityId) ?? this.defaultOptions;

      // Throttle size updates based on colorUpdateInterval
      const shouldUpdateColors = now - this.lastColorUpdateTime > options.colorUpdateInterval;
      if (shouldUpdateColors) {
        this.updateTracePointSizes(entityId);
        // Check and remove expired points based on effective lifetime
        this.removeExpiredPoints(entityId, trace);
      }
    });

    // Update timestamp if any entity was updated
    if (this.trackedEntities.size > 0) {
      const anyOptions = this.entityOptions.values().next().value ?? this.defaultOptions;
      if (Date.now() - this.lastColorUpdateTime > anyOptions.colorUpdateInterval) {
        this.lastColorUpdateTime = Date.now();
      }
    }
  }

  // Track last removal time per entity for staggered removal
  private lastRemovalTime: Map<string, number> = new Map();

  // Remove points sequentially from tail to head
  // Only removes ONE point per call if the oldest has exceeded base lifetime
  // Uses dynamic staggered timing - slower when fewer points remain
  private removeExpiredPoints(entityId: string, trace: EntityTrace) {
    if (trace.coordinates.length === 0) return;

    const options = this.entityOptions.get(entityId) ?? this.defaultOptions;
    const baseLifetime = options.coordinateLifetime;
    const now = Date.now();

    // Get the oldest point (first in array = tail)
    const oldestCoord = trace.coordinates[0];
    const oldestAge = now - oldestCoord.timestamp;

    // Only start removing after the oldest point exceeds base lifetime
    if (oldestAge <= baseLifetime) return;

    // Dynamic removal interval - much slower when fewer points remain
    const pointCount = trace.coordinates.length;
    // Exponential slowdown as points decrease
    const intervalFactor = Math.pow(
      Math.max(0, 1 - pointCount / options.removalSlowdownThreshold),
      options.removalSlowdownPower
    );
    const removalInterval = options.removalIntervalMin +
      (options.removalIntervalMax - options.removalIntervalMin) * intervalFactor;

    const lastRemoval = this.lastRemovalTime.get(entityId) ?? 0;
    if (now - lastRemoval < removalInterval) return;

    // Remove the oldest point
    this.lastRemovalTime.set(entityId, now);
    this.removeCoordinate(entityId, oldestCoord.id);
  }

  // Cleanup when plugin is destroyed
  destroy() {
    this.isDestroyed = true;
    this.stopAnimationLoop();
    this.unsubscribeFromEntityChanges();

    // Clear all timers first
    this.coordinateTimers.forEach((timer) => clearTimeout(timer));
    this.coordinateTimers.clear();

    // Remove all trace entities - but don't do it synchronously
    // Schedule for next frame to avoid render conflicts
    const entitiesToRemove: string[] = [];
    this.trackedEntities.forEach((trace) => {
      trace.coordinates.forEach((coord) => {
        entitiesToRemove.push(coord.id);
      });
    });

    // Clear tracked entities
    this.trackedEntities.clear();
    this.entityOptions.clear();
    this.lastRemovalTime.clear();

    // Defer entity removal
    if (entitiesToRemove.length > 0) {
      setTimeout(() => {
        try {
          if (this.map.viewer.isDestroyed()) return;
          entitiesToRemove.forEach((id) => {
            try {
              this.dataManager.removeItem(id);
            } catch {
              // Ignore
            }
          });
        } catch {
          // Ignore
        }
      }, 0);
    }
  }
}
