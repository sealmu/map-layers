import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Entity,
  CustomDataSource,
  Color,
  Cartesian2,
  Cartesian3,
  Cartographic,
  PolygonHierarchy,
  PolylineDashMaterialProperty,
  CallbackProperty,
  Math as CesiumMath,
  JulianDate,
  defined,
} from "cesium";
import { useViewer } from "@mprest/map-core";
import type {
  ExtensionModule,
  ExtensionContext,
  ViewerWithConfigs,
  MultiSelectConfig,
} from "../../types";

// ============================================
// Types
// ============================================

export interface SelectRectangle {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type SelectTarget =
  | string
  | string[]
  | Cartesian2
  | Cartesian2[]
  | SelectRectangle;

export interface MultiSelectApi {
  /** Switch multi-select mode on/off */
  switchMultiSelect: (enabled: boolean) => void;
  /** Current multi-select mode state */
  multiselect: boolean;
  /** Select entities by id, ids, screen point(s), or geographic rectangle */
  select: (target: SelectTarget) => void;
  /** Clear all selections */
  reset: () => void;
  /** Remove specific entity(ies) from selection */
  unselect: (id: string | string[]) => void;
  /** Currently selected entities */
  selections: Entity[];
}

// ============================================
// Helpers
// ============================================

const DATASOURCE_NAME = "__multiselect__";

function isSelectRectangle(target: SelectTarget): target is SelectRectangle {
  return (
    typeof target === "object" &&
    !Array.isArray(target) &&
    !(target instanceof Cartesian2) &&
    "west" in target &&
    "south" in target &&
    "east" in target &&
    "north" in target
  );
}

function findEntityById(viewer: ViewerWithConfigs, id: string): Entity | null {
  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i);
    if (ds.name === DATASOURCE_NAME) continue;
    const entity = ds.entities.getById(id);
    if (entity) return entity;
  }
  const defaultEntity = viewer.entities.getById(id);
  return defaultEntity ?? null;
}

function pickEntityAtPosition(
  viewer: ViewerWithConfigs,
  screenPosition: Cartesian2,
): Entity | null {
  const pickedObject = viewer.scene.pick(screenPosition);
  if (defined(pickedObject) && pickedObject.id instanceof Entity) {
    return pickedObject.id;
  }
  return null;
}

function findEntitiesInRectangle(
  viewer: ViewerWithConfigs,
  rect: SelectRectangle,
): Entity[] {
  const entities: Entity[] = [];
  const currentTime = viewer.clock.currentTime;

  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i);
    if (ds.name === DATASOURCE_NAME) continue;

    ds.entities.values.forEach((entity) => {
      const position = entity.position?.getValue(currentTime);
      if (position) {
        const cartographic = Cartographic.fromCartesian(position);
        const lon = CesiumMath.toDegrees(cartographic.longitude);
        const lat = CesiumMath.toDegrees(cartographic.latitude);
        if (
          lon >= rect.west &&
          lon <= rect.east &&
          lat >= rect.south &&
          lat <= rect.north
        ) {
          entities.push(entity);
        }
      }
    });
  }
  return entities;
}

function getPropertyValue<T>(property: unknown): T | undefined {
  if (property === undefined || property === null) return undefined;
  if (typeof property === "number" || typeof property === "string")
    return property as T;
  if (
    typeof property === "object" &&
    "getValue" in property! &&
    typeof (property as { getValue: unknown }).getValue === "function"
  ) {
    return (property as { getValue: (time: JulianDate) => T }).getValue(
      JulianDate.now(),
    );
  }
  return undefined;
}

const SELECTION_PADDING = 16;
const DEFAULT_SELECTION_SIZE = 40;
const SELECTION_Z_OFFSET = 5; // meters above original to avoid z-fighting

// Modern selection color palette
const SELECTION_COLOR = Color.fromCssColorString("#29B6F6"); // Light Blue 400
const SELECTION_GLOW_COLOR = SELECTION_COLOR.withAlpha(0.15);
const SELECTION_RING_COLOR = SELECTION_COLOR.withAlpha(0.9);
const SELECTION_DASH_MATERIAL = new PolylineDashMaterialProperty({
  color: SELECTION_RING_COLOR,
  gapColor: Color.TRANSPARENT,
  dashLength: 12,
});


function calculateEntityPixelSize(entity: Entity): number {
  let maxSize = 0;

  // Point graphics — pixelSize is in pixels
  if (entity.point) {
    const px = getPropertyValue<number>(entity.point.pixelSize);
    if (px) maxSize = Math.max(maxSize, px);
  }

  // Billboard graphics — width/height in pixels
  if (entity.billboard) {
    const w = getPropertyValue<number>(entity.billboard.width);
    const h = getPropertyValue<number>(entity.billboard.height);
    const dim = Math.max(w ?? 0, h ?? 0);
    if (dim > 0) maxSize = Math.max(maxSize, dim);
  }

  // Label graphics — estimate from font size and text length
  if (entity.label) {
    const font = getPropertyValue<string>(entity.label.font);
    const text = getPropertyValue<string>(entity.label.text);
    if (font) {
      const match = font.match(/(\d+)(px|pt)/);
      if (match) {
        let fontSize = parseInt(match[1], 10);
        if (match[2] === "pt") fontSize = Math.round(fontSize * 1.33);
        const charCount = text?.length ?? 5;
        const estimatedWidth = charCount * fontSize * 0.6;
        const estimatedHeight = fontSize * 1.2;
        // Use diagonal of bounding box so the circle wraps the whole text
        const diagonal = Math.sqrt(estimatedWidth ** 2 + estimatedHeight ** 2);
        maxSize = Math.max(maxSize, diagonal);
      }
    }
  }

  // Ellipse / model — no easy pixel conversion; use a generous fallback
  if (entity.ellipse || entity.model) {
    maxSize = Math.max(maxSize, 60);
  }

  return maxSize > 0 ? maxSize + SELECTION_PADDING : DEFAULT_SELECTION_SIZE;
}

const CIRCLE_SEGMENTS = 64;

/** Compute centroid + bounding radius for an array of Cartesian3 positions */
function computeBoundingCircle(positions: Cartesian3[]): {
  center: Cartographic;
  radius: number;
} {
  // Average lon/lat for centroid
  let lonSum = 0, latSum = 0, hSum = 0;
  for (const p of positions) {
    const c = Cartographic.fromCartesian(p);
    lonSum += c.longitude;
    latSum += c.latitude;
    hSum += c.height;
  }
  const center = new Cartographic(
    lonSum / positions.length,
    latSum / positions.length,
    hSum / positions.length,
  );
  const centerCart = Cartesian3.fromRadians(center.longitude, center.latitude, center.height);
  let maxDist = 0;
  for (const p of positions) {
    maxDist = Math.max(maxDist, Cartesian3.distance(centerCart, p));
  }
  return { center, radius: maxDist };
}

/** Generate a closed polyline ring forming a circle */
function generateCirclePositions(
  center: Cartographic,
  radiusMeters: number,
  height: number,
): Cartesian3[] {
  const positions: Cartesian3[] = [];
  for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
    const angle = (2 * Math.PI * i) / CIRCLE_SEGMENTS;
    const dLon = (radiusMeters * Math.cos(angle)) / (6378137 * Math.cos(center.latitude));
    const dLat = (radiusMeters * Math.sin(angle)) / 6378137;
    positions.push(
      Cartesian3.fromRadians(center.longitude + dLon, center.latitude + dLat, height),
    );
  }
  return positions;
}

/** Build the standard dashed-circle selection visual that dynamically follows entity position */
function buildCircleVisual(
  entityId: string,
  getPos: () => Cartesian3 | undefined,
  viewer: ViewerWithConfigs,
  pixelSize: number,
): Entity.ConstructorOptions {
  const computeCirclePositions = (): Cartesian3[] => {
    const pos = getPos();
    if (!pos) return [];
    const distance = Cartesian3.distance(viewer.camera.positionWC, pos);
    const frustum = viewer.camera.frustum as { fov?: number };
    const fov = frustum.fov ?? Math.PI / 3;
    const metersPerPixel = distance * 2 * Math.tan(fov / 2) / viewer.scene.canvas.clientHeight;
    const radiusMeters = ((pixelSize - SELECTION_PADDING + 4) / 2) * metersPerPixel;
    const center = Cartographic.fromCartesian(pos);
    const height = center.height + SELECTION_Z_OFFSET;
    return generateCirclePositions(center, radiusMeters, height);
  };

  return {
    id: `__ms_${entityId}`,
    polygon: {
      hierarchy: new CallbackProperty(() => new PolygonHierarchy(computeCirclePositions()), false),
      material: SELECTION_GLOW_COLOR,
      height: new CallbackProperty(() => {
        const pos = getPos();
        if (!pos) return 0;
        return Cartographic.fromCartesian(pos).height + SELECTION_Z_OFFSET;
      }, false),
    },
    polyline: {
      positions: new CallbackProperty(computeCirclePositions, false),
      width: 3,
      material: SELECTION_DASH_MATERIAL,
    },
  };
}

function createDefaultSelectionVisual(
  entity: Entity,
  viewer: ViewerWithConfigs,
): Entity.ConstructorOptions | null {
  // Polygon entities — circle at centroid
  if (entity.polygon) {
    const getPos = () => {
      const hierarchy = getPropertyValue<PolygonHierarchy>(entity.polygon!.hierarchy);
      if (!hierarchy || hierarchy.positions.length === 0) return undefined;
      const { center } = computeBoundingCircle(hierarchy.positions);
      return Cartesian3.fromRadians(center.longitude, center.latitude, center.height);
    };
    if (getPos()) {
      return buildCircleVisual(entity.id, getPos, viewer, DEFAULT_SELECTION_SIZE);
    }
  }

  // Polyline entities — circle at midpoint
  if (entity.polyline && !entity.position) {
    const getPos = () => {
      const positions = getPropertyValue<Cartesian3[]>(entity.polyline!.positions);
      if (!positions || positions.length === 0) return undefined;
      const { center } = computeBoundingCircle(positions);
      return Cartesian3.fromRadians(center.longitude, center.latitude, center.height);
    };
    if (getPos()) {
      return buildCircleVisual(entity.id, getPos, viewer, DEFAULT_SELECTION_SIZE);
    }
  }

  // Position-based entities (points, billboards, labels, etc.)
  if (!entity.position) return null;
  const getPos = () => entity.position?.getValue(viewer.clock.currentTime);
  if (!getPos()) return null;

  return buildCircleVisual(entity.id, getPos, viewer, calculateEntityPixelSize(entity));
}

// ============================================
// Extension Hook
// ============================================

const NOOP_API: MultiSelectApi = {
  switchMultiSelect: () => {},
  multiselect: false,
  select: () => {},
  reset: () => {},
  unselect: () => {},
  selections: [],
};

const useMultiSelect = (ctx: ExtensionContext): MultiSelectApi => {
  const config = ctx.multiSelect as MultiSelectConfig | undefined;
  const enabled = config?.isEnabled ?? false;
  const mapClickDeselect = config?.mapClickDeselect ?? true;
  const { viewer } = useViewer();
  const cesiumViewer = viewer as unknown as ViewerWithConfigs | null;

  const [isMultiSelect, setIsMultiSelect] = useState(enabled);
  const [selectedMap, setSelectedMap] = useState<Map<string, Entity>>(
    new Map(),
  );
  const selectionDataSourceRef = useRef<CustomDataSource | null>(null);
  const isMultiSelectRef = useRef(enabled);

  // Sync multi-select mode with the enabled prop
  useEffect(() => {
    isMultiSelectRef.current = enabled;
    setIsMultiSelect(enabled);
  }, [enabled]);

  // Get callbacks from context (passed from CesiumMapProps via extensionContext)
  const onMultiSelecting = ctx.onMultiSelecting as
    | ((selections: Entity[], entity: Entity) => boolean | void)
    | undefined;
  const onMultiSelect = ctx.onMultiSelect as
    | ((entities: Entity[]) => void)
    | undefined;
  const onRenderMultiSelection = ctx.onRenderMultiSelection as
    | ((entity: Entity) => Entity.ConstructorOptions | null)
    | undefined;

  // Keep ref in sync so the onClick subscriber always has the latest callback
  const onMultiSelectingRef = useRef(onMultiSelecting);
  onMultiSelectingRef.current = onMultiSelecting;

  // Keep ref in sync with state
  const switchMultiSelect = useCallback((enabled: boolean) => {
    setIsMultiSelect(enabled);
    isMultiSelectRef.current = enabled;
  }, []);

  // Initialize data source for selection visuals
  useEffect(() => {
    if (!enabled || !cesiumViewer) return;

    const ds = new CustomDataSource(DATASOURCE_NAME);
    selectionDataSourceRef.current = ds;
    cesiumViewer.dataSources.add(ds);

    return () => {
      if (selectionDataSourceRef.current) {
        if (cesiumViewer.dataSources.contains(selectionDataSourceRef.current)) {
          cesiumViewer.dataSources.remove(
            selectionDataSourceRef.current,
            true,
          );
        }
        selectionDataSourceRef.current = null;
      }
    };
  }, [enabled, cesiumViewer]);

  // Subscribe to onClick to handle click-to-select in multi-select mode
  useEffect(() => {
    if (!enabled || !cesiumViewer) return;

    const unsubscribe = cesiumViewer.handlers.onClick.subscribe(
      (entity: Entity | null) => {
        if (!isMultiSelectRef.current) return; // Pass through when not in multi-select

        if (entity) {
          // Toggle selection
          setSelectedMap((prev) => {
            const next = new Map(prev);
            if (next.has(entity.id)) {
              next.delete(entity.id);
            } else {
              // Check onMultiSelecting before adding
              if (onMultiSelectingRef.current) {
                const currentSelections = Array.from(prev.values());
                if (onMultiSelectingRef.current(currentSelections, entity) === false) {
                  return prev; // Selection vetoed — no change
                }
              }
              next.set(entity.id, entity);
            }
            return next;
          });
        } else if (mapClickDeselect) {
          // Clicked empty space — deselect all
          setSelectedMap(new Map());
        }

        return false; // Prevent single-entity selection
      },
    );

    return unsubscribe;
  }, [enabled, cesiumViewer]);

  // Render selection visuals when selected entities change (incremental diff)
  useEffect(() => {
    if (!enabled) return;
    const ds = selectionDataSourceRef.current;
    if (!ds) return;

    // Build set of expected visual IDs from current selection
    const expectedIds = new Set<string>();
    selectedMap.forEach((_entity, id) => {
      expectedIds.add(`__ms_${id}`);
    });

    // Remove visuals that are no longer selected
    const toRemove: Entity[] = [];
    for (let i = 0; i < ds.entities.values.length; i++) {
      const visual = ds.entities.values[i];
      if (!expectedIds.has(visual.id)) {
        toRemove.push(visual);
      }
    }
    toRemove.forEach((e) => ds.entities.remove(e));

    // Add visuals for newly selected entities
    selectedMap.forEach((entity, id) => {
      const visualId = `__ms_${id}`;
      if (ds.entities.getById(visualId)) return; // already exists

      let visual = onRenderMultiSelection?.(entity) ?? null;
      if (!visual) {
        visual = createDefaultSelectionVisual(entity, cesiumViewer!);
      }
      if (visual) {
        ds.entities.add(visual);
      }
    });
  }, [enabled, selectedMap, onRenderMultiSelection]);

  // Fire onMultiSelect event when selections change
  useEffect(() => {
    if (!enabled) return;
    onMultiSelect?.(Array.from(selectedMap.values()));
  }, [enabled, selectedMap, onMultiSelect]);

  // Select function - handles all target types
  const select = useCallback(
    (target: SelectTarget) => {
      if (!cesiumViewer) return;

      const addEntities = (entities: Entity[]) => {
        if (entities.length === 0) return;
        setSelectedMap((prev) => {
          const next = new Map(prev);
          entities.forEach((e) => next.set(e.id, e));
          return next;
        });
      };

      if (typeof target === "string") {
        // Single ID
        const entity = findEntityById(cesiumViewer, target);
        if (entity) addEntities([entity]);
      } else if (Array.isArray(target)) {
        if (target.length === 0) return;
        if (typeof target[0] === "string") {
          // Array of IDs
          const entities = (target as string[])
            .map((id) => findEntityById(cesiumViewer, id))
            .filter((e): e is Entity => e !== null);
          addEntities(entities);
        } else {
          // Array of Cartesian2 (screen positions)
          const entities = (target as Cartesian2[])
            .map((pos) => pickEntityAtPosition(cesiumViewer, pos))
            .filter((e): e is Entity => e !== null);
          addEntities(entities);
        }
      } else if (target instanceof Cartesian2) {
        // Single screen position
        const entity = pickEntityAtPosition(cesiumViewer, target);
        if (entity) addEntities([entity]);
      } else if (isSelectRectangle(target)) {
        // Geographic rectangle
        const entities = findEntitiesInRectangle(cesiumViewer, target);
        addEntities(entities);
      }
    },
    [cesiumViewer],
  );

  // Reset all selections
  const reset = useCallback(() => {
    setSelectedMap(new Map());
  }, []);

  // Unselect specific entity(ies)
  const unselect = useCallback((id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    setSelectedMap((prev) => {
      const next = new Map(prev);
      ids.forEach((entityId) => next.delete(entityId));
      return next;
    });
  }, []);

  // Memoized selections array
  const selections = useMemo(
    () => Array.from(selectedMap.values()),
    [selectedMap],
  );

  return useMemo(
    () =>
      enabled
        ? {
            switchMultiSelect,
            multiselect: isMultiSelect,
            select,
            reset,
            unselect,
            selections,
          }
        : NOOP_API,
    [enabled, switchMultiSelect, isMultiSelect, select, reset, unselect, selections],
  );
};

// ============================================
// Extension Definition
// ============================================

const multiSelectExtension: ExtensionModule<MultiSelectApi> = {
  name: "multiSelect",
  useExtension: useMultiSelect,
  priority: 5,
};

// Type augmentation - makes api.multiSelect fully typed
declare module "../../types" {
  interface MapApi {
    multiSelect?: MultiSelectApi;
  }
}

export default multiSelectExtension;
