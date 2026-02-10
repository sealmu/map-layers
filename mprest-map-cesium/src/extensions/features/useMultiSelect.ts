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
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  KeyboardEventModifier,
  Math as CesiumMath,
  JulianDate,
  defined,
} from "cesium";
import { useViewer, createEventHandler } from "@mprest/map-core";
import type {
  ExtensionModule,
  ExtensionContext,
  ViewerWithConfigs,
  MultiSelectConfig,
  DblClickAction,
  ClusterBillboardId,
  IEventHandler,
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

export interface MultiSelectEventUtils {
  /** Compute screen position for an entity (handles points, polygons, polylines) */
  getScreenPosition: (entity: Entity) => Cartesian2 | undefined;
}

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
  /** Configured modifier key (if any) */
  modifier?: "ctrl" | "shift" | "alt";
  /** Configured double-click action */
  dblClickAction: DblClickAction;
  /** Event handler fired when selections change */
  onMultiSelect: IEventHandler<(selections: Entity[], prevSelections: Entity[], utils: MultiSelectEventUtils) => void>;
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

/** Pick entities at a screen position, resolving cluster billboards to their contained entities */
function pickEntitiesAtPosition(
  viewer: ViewerWithConfigs,
  screenPosition: Cartesian2,
): Entity[] {
  const picks = viewer.scene.drillPick(screenPosition);
  for (const pick of picks) {
    if (!defined(pick)) continue;
    // Check for cluster billboard
    const id = pick.id as { isCluster?: boolean; entities?: Array<{ id: string }> } | Entity | undefined;
    if (id && typeof id === "object" && "isCluster" in id && (id as ClusterBillboardId).isCluster) {
      const clusterData = id as ClusterBillboardId;
      const entities: Entity[] = [];
      for (const entry of clusterData.entities) {
        const entity = findEntityById(viewer, entry.id);
        if (entity) entities.push(entity);
      }
      return entities;
    }
    // Regular entity
    if (id instanceof Entity) {
      if (typeof id.id === "string" && id.id.startsWith("__ms_")) continue;
      return [id];
    }
  }
  return [];
}

function isPositionInRect(pos: Cartesian3, rect: SelectRectangle): boolean {
  const cartographic = Cartographic.fromCartesian(pos);
  const lon = CesiumMath.toDegrees(cartographic.longitude);
  const lat = CesiumMath.toDegrees(cartographic.latitude);
  return lon >= rect.west && lon <= rect.east && lat >= rect.south && lat <= rect.north;
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
        if (isPositionInRect(position, rect)) entities.push(entity);
        return;
      }

      // Polygon entities — check if any vertex is in the rectangle
      if (entity.polygon) {
        const hierarchy = getPropertyValue<PolygonHierarchy>(entity.polygon.hierarchy);
        if (hierarchy && hierarchy.positions.some((p) => isPositionInRect(p, rect))) {
          entities.push(entity);
          return;
        }
      }

      // Polyline entities — check if any vertex is in the rectangle
      if (entity.polyline) {
        const positions = getPropertyValue<Cartesian3[]>(entity.polyline.positions);
        if (positions && positions.some((p) => isPositionInRect(p, rect))) {
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

function getEntityRendererType(entity: Entity): string | undefined {
  return entity.properties?.getValue?.(JulianDate.now())?.rendererType as string | undefined;
}

function getEntityDataSource(viewer: ViewerWithConfigs, entity: Entity): CustomDataSource | null {
  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i);
    if (ds.name === DATASOURCE_NAME) continue;
    if (ds.name.startsWith("__")) continue;
    if (ds.entities.getById(entity.id)) return ds;
  }
  return null;
}

function findEntitiesByAction(
  viewer: ViewerWithConfigs,
  entity: Entity,
  action: DblClickAction,
): Entity[] {
  if (action === "none") return [];

  const entityDs = getEntityDataSource(viewer, entity);
  const entityType = getEntityRendererType(entity);
  const results: Entity[] = [];

  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i);
    if (ds.name === DATASOURCE_NAME) continue;
    if (ds.name.startsWith("__")) continue;

    const matchesLayer = action === "selectByLayer" || action === "selectByLayerAndType";
    if (matchesLayer && ds !== entityDs) continue;

    for (const e of ds.entities.values) {
      if (action === "selectByType" || action === "selectByLayerAndType") {
        if (getEntityRendererType(e) !== entityType) continue;
      }
      results.push(e);
    }
  }
  return results;
}

/** Check if an entity is currently visible on screen (not hidden by clustering) */
function isEntityVisibleOnScreen(viewer: ViewerWithConfigs, entity: Entity): boolean {
  const pos = entity.position?.getValue(viewer.clock.currentTime);
  if (!pos) return true; // Non-positioned entities (polygons, polylines) aren't clustered
  const screenPos = viewer.scene.cartesianToCanvasCoordinates(pos);
  if (!screenPos) return false;
  // If entity can be found via drillPick at its own position, it's visible.
  // When Cesium clusters an entity, its visual is removed from the scene entirely.
  const picks = viewer.scene.drillPick(screenPos, 5);
  for (const pick of picks) {
    if (!defined(pick)) continue;
    if (pick.id instanceof Entity && pick.id.id === entity.id) return true;
  }
  return false;
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
  // Polygon entities — bounding circle around the polygon
  if (entity.polygon) {
    const getHierarchy = () => getPropertyValue<PolygonHierarchy>(entity.polygon!.hierarchy);
    const hierarchy = getHierarchy();
    if (hierarchy && hierarchy.positions.length > 0) {
      const computeCircle = (): Cartesian3[] => {
        const h = getHierarchy();
        if (!h || h.positions.length === 0) return [];
        const { center, radius } = computeBoundingCircle(h.positions);
        const height = center.height + SELECTION_Z_OFFSET;
        return generateCirclePositions(center, radius * 1.15, height);
      };
      return {
        id: `__ms_${entity.id}`,
        polygon: {
          hierarchy: new CallbackProperty(() => new PolygonHierarchy(computeCircle()), false),
          material: SELECTION_GLOW_COLOR,
          height: new CallbackProperty(() => {
            const h = getHierarchy();
            if (!h || h.positions.length === 0) return 0;
            const { center } = computeBoundingCircle(h.positions);
            return center.height + SELECTION_Z_OFFSET;
          }, false),
        },
        polyline: {
          positions: new CallbackProperty(computeCircle, false),
          width: 3,
          material: SELECTION_DASH_MATERIAL,
        },
      };
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

/** Build a selection visual for a cluster billboard at a fixed world position */
function createClusterSelectionVisual(
  visualId: string,
  clusterPosition: Cartesian3,
  viewer: ViewerWithConfigs,
): Entity.ConstructorOptions {
  const getPos = () => clusterPosition;
  // Clusters are typically larger than individual entities
  const CLUSTER_VISUAL_SIZE = 60;
  // buildCircleVisual prefixes with "__ms_", so strip it from our visualId
  const rawId = visualId.replace(/^__ms_/, "");
  return buildCircleVisual(rawId, getPos, viewer, CLUSTER_VISUAL_SIZE);
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
  dblClickAction: "none",
  onMultiSelect: createEventHandler(),
};

const useMultiSelect = (ctx: ExtensionContext): MultiSelectApi => {
  const config = ctx.multiSelect as MultiSelectConfig | undefined;
  const enabled = config?.isEnabled ?? false;
  const mapClickDeselect = config?.mapClickDeselect ?? true;
  const selectionTool = config?.selectionTool ?? false;
  const modifier = config?.modifier;
  const dblClickAction: DblClickAction = config?.dblClickAction ?? "none";
  const cesiumModifier: KeyboardEventModifier | undefined =
    modifier === "ctrl" ? KeyboardEventModifier.CTRL :
    modifier === "shift" ? KeyboardEventModifier.SHIFT :
    modifier === "alt" ? KeyboardEventModifier.ALT : undefined;
  const { viewer } = useViewer();
  const cesiumViewer = viewer as unknown as ViewerWithConfigs | null;

  const [isMultiSelect, setIsMultiSelect] = useState(enabled);
  const [selectedMap, setSelectedMap] = useState<Map<string, Entity>>(
    new Map(),
  );
  const selectionDataSourceRef = useRef<CustomDataSource | null>(null);
  const isMultiSelectRef = useRef(enabled);
  const modifierHeldRef = useRef(false);
  const [clusterVersion, setClusterVersion] = useState(0);

  // Sync multi-select mode with the enabled prop
  useEffect(() => {
    isMultiSelectRef.current = enabled;
    setIsMultiSelect(enabled);
  }, [enabled]);

  // Track modifier key state via DOM events
  useEffect(() => {
    if (!enabled || !modifier) return;

    const checkModifier = (e: KeyboardEvent) => {
      modifierHeldRef.current =
        modifier === "ctrl" ? (e.ctrlKey || e.metaKey) :
        modifier === "shift" ? e.shiftKey :
        modifier === "alt" ? e.altKey : false;
    };
    const resetModifier = () => { modifierHeldRef.current = false; };

    document.addEventListener("keydown", checkModifier);
    document.addEventListener("keyup", checkModifier);
    window.addEventListener("blur", resetModifier);

    return () => {
      document.removeEventListener("keydown", checkModifier);
      document.removeEventListener("keyup", checkModifier);
      window.removeEventListener("blur", resetModifier);
      modifierHeldRef.current = false;
    };
  }, [enabled, modifier]);

  // Get callbacks from context (passed from CesiumMapProps via extensionContext)
  const onMultiSelecting = ctx.onMultiSelecting as
    | ((selections: Entity[], entity: Entity) => boolean | void)
    | undefined;
  const onMultiSelectProp = ctx.onMultiSelect as
    | ((entities: Entity[], prevEntities: Entity[], utils: MultiSelectEventUtils) => void)
    | undefined;
  const onRenderMultiSelection = ctx.onRenderMultiSelection as
    | ((entity: Entity) => Entity.ConstructorOptions | null)
    | undefined;

  // Keep ref in sync so the onClick subscriber always has the latest callback
  const onMultiSelectingRef = useRef(onMultiSelecting);
  onMultiSelectingRef.current = onMultiSelecting;

  // Event handler for selection changes
  const onMultiSelectHandler = useMemo(() => createEventHandler<(selections: Entity[], prevSelections: Entity[], utils: MultiSelectEventUtils) => void>(), []);

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

  // Re-evaluate selection visuals when camera stops moving (clustering may have changed)
  useEffect(() => {
    if (!enabled || !cesiumViewer) return;
    const removeListener = cesiumViewer.camera.moveEnd.addEventListener(() => {
      setClusterVersion((v) => v + 1);
    });
    return removeListener;
  }, [enabled, cesiumViewer]);

  // Subscribe to onClick to handle click-to-select in multi-select mode
  useEffect(() => {
    if (!enabled || !cesiumViewer) return;

    const unsubscribe = cesiumViewer.handlers.onClick.subscribe(
      (entity: Entity | null) => {
        if (!isMultiSelectRef.current) return; // Pass through to Cesium native select

        const isMultiMode = !modifier || modifierHeldRef.current;

        if (entity) {
          if (isMultiMode) {
            // Modifier held (or no modifier configured) — toggle in multi-selection
            setSelectedMap((prev) => {
              const next = new Map(prev);
              if (next.has(entity.id)) {
                next.delete(entity.id);
              } else {
                if (onMultiSelectingRef.current) {
                  const currentSelections = Array.from(prev.values());
                  if (onMultiSelectingRef.current(currentSelections, entity) === false) {
                    return prev;
                  }
                }
                next.set(entity.id, entity);
              }
              return next;
            });
          } else {
            // No modifier held — single-select: replace selection with just this entity
            setSelectedMap(new Map([[entity.id, entity]]));
          }
        } else if (mapClickDeselect) {
          // Clicked empty space — deselect all
          setSelectedMap(new Map());
        }

        return false; // Always prevent Cesium native selection when multi-select is enabled
      },
    );

    return unsubscribe;
  }, [enabled, cesiumViewer]);

  // Handle modifier+click directly via ScreenSpaceEventHandler
  // (Cesium routes modifier-qualified clicks separately from unmodified clicks)
  useEffect(() => {
    if (!enabled || !cesiumViewer || cesiumModifier === undefined) return;

    const handler = new ScreenSpaceEventHandler(cesiumViewer.scene.canvas);

    handler.setInputAction((click: { position: Cartesian2 }) => {
      if (!isMultiSelectRef.current) return;

      const pickedEntities = pickEntitiesAtPosition(cesiumViewer, click.position);

      if (pickedEntities.length > 0) {
        // Modifier is held — toggle in multi-selection
        setSelectedMap((prev) => {
          const next = new Map(prev);
          for (const entity of pickedEntities) {
            if (next.has(entity.id)) {
              next.delete(entity.id);
            } else {
              if (onMultiSelectingRef.current) {
                const currentSelections = Array.from(next.values());
                if (onMultiSelectingRef.current(currentSelections, entity) === false) {
                  continue;
                }
              }
              next.set(entity.id, entity);
            }
          }
          return next;
        });
      } else if (mapClickDeselect) {
        setSelectedMap(new Map());
      }
    }, ScreenSpaceEventType.LEFT_CLICK, cesiumModifier);

    return () => { handler.destroy(); };
  }, [enabled, cesiumViewer, cesiumModifier]);

  // Handle modifier + double-click to batch-select by layer/type
  useEffect(() => {
    if (!enabled || !cesiumViewer || dblClickAction === "none") return;

    const handler = new ScreenSpaceEventHandler(cesiumViewer.scene.canvas);

    const onDblClick = (click: { position: Cartesian2 }) => {
      if (!isMultiSelectRef.current) return;
      if (modifier && !modifierHeldRef.current) return;

      const pickedEntities = pickEntitiesAtPosition(cesiumViewer, click.position);
      if (pickedEntities.length === 0) return;

      // Collect all entities matched by the dblClickAction for each picked entity
      const matched = new Map<string, Entity>();
      for (const picked of pickedEntities) {
        for (const e of findEntitiesByAction(cesiumViewer, picked, dblClickAction)) {
          matched.set(e.id, e);
        }
      }
      if (matched.size === 0) return;

      setSelectedMap((prev) => {
        const next = new Map(prev);
        for (const entity of matched.values()) {
          if (next.has(entity.id)) continue;
          if (onMultiSelectingRef.current) {
            const currentSelections = Array.from(next.values());
            if (onMultiSelectingRef.current(currentSelections, entity) === false) continue;
          }
          next.set(entity.id, entity);
        }
        return next;
      });
    };

    handler.setInputAction(onDblClick, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    if (cesiumModifier !== undefined) {
      handler.setInputAction(onDblClick, ScreenSpaceEventType.LEFT_DOUBLE_CLICK, cesiumModifier);
    }

    return () => { handler.destroy(); };
  }, [enabled, cesiumViewer, dblClickAction, modifier, cesiumModifier]);

  // Render selection visuals when selected entities change or clustering state changes.
  useEffect(() => {
    if (!enabled) return;
    const ds = selectionDataSourceRef.current;
    if (!ds || !cesiumViewer) return;

    // Determine which entities should have visuals (selected AND not hidden by cluster)
    const shouldShowVisual = new Set<string>();
    selectedMap.forEach((entity, id) => {
      if (isEntityVisibleOnScreen(cesiumViewer, entity)) {
        shouldShowVisual.add(id);
      }
    });

    // Build set of expected visual IDs
    const expectedIds = new Set<string>();
    shouldShowVisual.forEach((id) => {
      expectedIds.add(`__ms_${id}`);
    });

    // Collect selected entities that are NOT visible (hidden by clustering)
    const selectedIds = new Set(selectedMap.keys());
    const clusteredEntities: Entity[] = [];
    selectedMap.forEach((entity, id) => {
      if (!shouldShowVisual.has(id)) clusteredEntities.push(entity);
    });

    // Scan for cluster billboards containing selected entities
    const clusterVisuals: Array<{ visualId: string; position: Cartesian3 }> = [];
    const foundClusterKeys = new Set<string>();
    let clusterIdx = 0;

    const SEARCH_RADIUS = 150;
    const SEARCH_STEP = 40;
    for (const entity of clusteredEntities) {
      const pos = entity.position?.getValue(cesiumViewer.clock.currentTime);
      if (!pos) continue;
      const screenPos = cesiumViewer.scene.cartesianToCanvasCoordinates(pos);
      if (!screenPos) continue;

      let found = false;
      // Spiral outward: check center first, then expand
      for (let dx = 0; Math.abs(dx) <= SEARCH_RADIUS && !found; dx = dx <= 0 ? -dx + SEARCH_STEP : -dx) {
        for (let dy = 0; Math.abs(dy) <= SEARCH_RADIUS && !found; dy = dy <= 0 ? -dy + SEARCH_STEP : -dy) {
          const picked = cesiumViewer.scene.pick(new Cartesian2(screenPos.x + dx, screenPos.y + dy));
          if (!picked) continue;
          const pickId = picked.id as ClusterBillboardId | undefined;
          if (!pickId || typeof pickId !== "object" || !pickId.isCluster) continue;
          if (!pickId.entities.some((e) => selectedIds.has(e.id))) continue;

          const key = pickId.entities.map((e) => e.id).sort().join(",");
          if (foundClusterKeys.has(key)) { found = true; continue; }
          foundClusterKeys.add(key);

          const bbPosition = (picked.primitive as { position?: Cartesian3 })?.position;
          if (!bbPosition) continue;

          const visualId = `__ms_cluster_${clusterIdx++}`;
          clusterVisuals.push({ visualId, position: bbPosition });
          found = true;
        }
      }
    }

    // Add cluster visual IDs to the expected set
    for (const { visualId } of clusterVisuals) {
      expectedIds.add(visualId);
    }

    // Remove all stale visuals (deselected, now-clustered, or stale cluster visuals)
    const toRemove: Entity[] = [];
    for (let i = 0; i < ds.entities.values.length; i++) {
      const visual = ds.entities.values[i];
      if (!expectedIds.has(visual.id)) {
        toRemove.push(visual);
      }
    }
    toRemove.forEach((e) => ds.entities.remove(e));

    // Add visuals for individual entities
    shouldShowVisual.forEach((id) => {
      const visualId = `__ms_${id}`;
      if (ds.entities.getById(visualId)) return;

      const entity = selectedMap.get(id)!;
      let visual = onRenderMultiSelection?.(entity) ?? null;
      if (!visual) {
        visual = createDefaultSelectionVisual(entity, cesiumViewer);
      }
      if (visual) {
        ds.entities.add(visual);
      }
    });

    // Add new cluster visuals
    for (const { visualId, position } of clusterVisuals) {
      if (ds.entities.getById(visualId)) continue;
      const visual = createClusterSelectionVisual(visualId, position, cesiumViewer);
      ds.entities.add(visual);
    }
  }, [enabled, cesiumViewer, selectedMap, onRenderMultiSelection, clusterVersion]);

  // Compute screen position for any entity type (point, polygon, polyline)
  const getScreenPosition = useCallback((entity: Entity): Cartesian2 | undefined => {
    if (!cesiumViewer) return undefined;
    let worldPos = entity.position?.getValue(cesiumViewer.clock.currentTime);
    if (!worldPos && entity.polygon) {
      const hierarchy = getPropertyValue<PolygonHierarchy>(entity.polygon.hierarchy);
      if (hierarchy && hierarchy.positions.length > 0) {
        const pts = hierarchy.positions;
        const sum = pts.reduce((acc, p) => Cartesian3.add(acc, p, acc), new Cartesian3(0, 0, 0));
        worldPos = Cartesian3.divideByScalar(sum, pts.length, new Cartesian3());
      }
    }
    if (!worldPos && entity.polyline) {
      const positions = getPropertyValue<Cartesian3[]>(entity.polyline.positions);
      if (positions && positions.length > 0) {
        const sum = positions.reduce((acc, p) => Cartesian3.add(acc, p, acc), new Cartesian3(0, 0, 0));
        worldPos = Cartesian3.divideByScalar(sum, positions.length, new Cartesian3());
      }
    }
    if (!worldPos) return undefined;
    return cesiumViewer.scene.cartesianToCanvasCoordinates(worldPos) ?? undefined;
  }, [cesiumViewer]);

  // Fire onMultiSelect event and notify subscribers when selections change
  const prevSelectionsRef = useRef<Entity[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const sels = Array.from(selectedMap.values());
    const prev = prevSelectionsRef.current;
    prevSelectionsRef.current = sels;
    const utils: MultiSelectEventUtils = { getScreenPosition };
    onMultiSelectProp?.(sels, prev, utils);
    onMultiSelectHandler.subscribers.forEach((cb) => cb(sels, prev, utils));
  }, [enabled, selectedMap, onMultiSelectProp, onMultiSelectHandler, getScreenPosition]);

  // Rubber-band selection tool — click-and-drag draws a dashed rectangle to select entities
  useEffect(() => {
    if (!enabled || !selectionTool || !cesiumViewer) return;

    const DRAG_THRESHOLD = 5; // px — minimum drag distance to activate rubber-band
    const canvas = cesiumViewer.scene.canvas;
    const container = canvas.parentElement;
    if (!container) return;

    // Create DOM overlay for selection rectangle
    const rectDiv = document.createElement("div");
    rectDiv.style.position = "absolute";
    rectDiv.style.border = `2px dashed ${SELECTION_RING_COLOR.toCssColorString()}`;
    rectDiv.style.background = SELECTION_GLOW_COLOR.toCssColorString();
    rectDiv.style.pointerEvents = "none";
    rectDiv.style.display = "none";
    rectDiv.style.zIndex = "1";
    container.style.position = "relative";
    container.appendChild(rectDiv);

    let startPosition: Cartesian2 | null = null;
    let isDragging = false;

    // Save camera control state
    const sscController = cesiumViewer.scene.screenSpaceCameraController;

    const handler = new ScreenSpaceEventHandler(canvas);

    const onLeftDown = (click: { position: Cartesian2 }) => {
      if (!isMultiSelectRef.current) return;
      if (modifier && !modifierHeldRef.current) return;
      startPosition = click.position.clone();
      isDragging = false;
    };

    const onMouseMove = (movement: { endPosition: Cartesian2 }) => {
      if (!startPosition || !isMultiSelectRef.current) return;
      if (modifier && !modifierHeldRef.current) { startPosition = null; return; }

      const dx = movement.endPosition.x - startPosition.x;
      const dy = movement.endPosition.y - startPosition.y;

      if (!isDragging) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        // Threshold reached — start rubber-band
        isDragging = true;
        sscController.enableRotate = false;
        sscController.enableTranslate = false;
        sscController.enableZoom = false;
        sscController.enableTilt = false;
        sscController.enableLook = false;
      }

      // Update rectangle overlay
      const left = Math.min(startPosition.x, movement.endPosition.x);
      const top = Math.min(startPosition.y, movement.endPosition.y);
      const width = Math.abs(dx);
      const height = Math.abs(dy);

      rectDiv.style.left = `${left}px`;
      rectDiv.style.top = `${top}px`;
      rectDiv.style.width = `${width}px`;
      rectDiv.style.height = `${height}px`;
      rectDiv.style.display = "block";
    };

    const onLeftUp = (click: { position: Cartesian2 }) => {
      if (!startPosition || !isMultiSelectRef.current) {
        startPosition = null;
        return;
      }

      // Re-enable camera controls
      sscController.enableRotate = true;
      sscController.enableTranslate = true;
      sscController.enableZoom = true;
      sscController.enableTilt = true;
      sscController.enableLook = true;

      // Hide overlay
      rectDiv.style.display = "none";

      if (!isDragging) {
        // Below threshold — let normal click handler fire
        startPosition = null;
        isDragging = false;
        return;
      }

      // Compute screen-space rectangle bounds
      const minX = Math.min(startPosition.x, click.position.x);
      const maxX = Math.max(startPosition.x, click.position.x);
      const minY = Math.min(startPosition.y, click.position.y);
      const maxY = Math.max(startPosition.y, click.position.y);

      // Find all entities whose screen position falls inside the rectangle
      const entitiesToSelect: Entity[] = [];
      const currentTime = cesiumViewer.clock.currentTime;

      const isScreenPosInRect = (pos: Cartesian3): boolean => {
        const screenPos = cesiumViewer.scene.cartesianToCanvasCoordinates(pos);
        if (!screenPos) return false;
        return screenPos.x >= minX && screenPos.x <= maxX && screenPos.y >= minY && screenPos.y <= maxY;
      };

      for (let i = 0; i < cesiumViewer.dataSources.length; i++) {
        const ds = cesiumViewer.dataSources.get(i);
        if (ds.name === DATASOURCE_NAME) continue;

        for (const entity of ds.entities.values) {
          // Position-based entities (points, billboards, labels, etc.)
          const pos = entity.position?.getValue(currentTime);
          if (pos) {
            if (isScreenPosInRect(pos)) entitiesToSelect.push(entity);
            continue;
          }

          // Polygon entities — check if any vertex projects into the rectangle
          if (entity.polygon) {
            const hierarchy = getPropertyValue<PolygonHierarchy>(entity.polygon.hierarchy);
            if (hierarchy && hierarchy.positions.some(isScreenPosInRect)) {
              entitiesToSelect.push(entity);
              continue;
            }
          }

          // Polyline entities — check if any vertex projects into the rectangle
          if (entity.polyline) {
            const positions = getPropertyValue<Cartesian3[]>(entity.polyline.positions);
            if (positions && positions.some(isScreenPosInRect)) {
              entitiesToSelect.push(entity);
            }
          }
        }
      }

      // Also detect cluster billboards within the lasso rectangle.
      // When entities are clustered, their individual screen positions may not match the
      // cluster billboard's position, so sample the rectangle to find cluster picks.
      const alreadyFound = new Set(entitiesToSelect.map((e) => e.id));
      const CLUSTER_SAMPLE_STEP = 30; // px
      for (let sx = minX; sx <= maxX; sx += CLUSTER_SAMPLE_STEP) {
        for (let sy = minY; sy <= maxY; sy += CLUSTER_SAMPLE_STEP) {
          const pick = cesiumViewer.scene.pick(new Cartesian2(sx, sy));
          if (!defined(pick)) continue;
          const id = pick.id as { isCluster?: boolean } | undefined;
          if (id && typeof id === "object" && "isCluster" in id && id.isCluster) {
            const clusterData = id as ClusterBillboardId;
            for (const entry of clusterData.entities) {
              if (alreadyFound.has(entry.id)) continue;
              const entity = findEntityById(cesiumViewer, entry.id);
              if (entity) {
                entitiesToSelect.push(entity);
                alreadyFound.add(entry.id);
              }
            }
          }
        }
      }

      // Add entities to selection (respecting onMultiSelecting veto)
      if (entitiesToSelect.length > 0) {
        setSelectedMap((prev) => {
          const next = new Map(prev);
          for (const entity of entitiesToSelect) {
            if (next.has(entity.id)) continue;
            if (onMultiSelectingRef.current) {
              const currentSelections = Array.from(next.values());
              if (onMultiSelectingRef.current(currentSelections, entity) === false) {
                continue;
              }
            }
            next.set(entity.id, entity);
          }
          return next;
        });
      }

      startPosition = null;
      isDragging = false;
    };

    // Register for unmodified events
    handler.setInputAction(onLeftDown, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(onMouseMove, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(onLeftUp, ScreenSpaceEventType.LEFT_UP);

    // Also register for modifier-qualified events so Cesium routes them correctly
    if (cesiumModifier !== undefined) {
      handler.setInputAction(onLeftDown, ScreenSpaceEventType.LEFT_DOWN, cesiumModifier);
      handler.setInputAction(onMouseMove, ScreenSpaceEventType.MOUSE_MOVE, cesiumModifier);
      handler.setInputAction(onLeftUp, ScreenSpaceEventType.LEFT_UP, cesiumModifier);
    }

    return () => {
      handler.destroy();
      // Re-enable camera controls in case cleanup happens mid-drag
      sscController.enableRotate = true;
      sscController.enableTranslate = true;
      sscController.enableZoom = true;
      sscController.enableTilt = true;
      sscController.enableLook = true;
      // Remove overlay
      if (rectDiv.parentElement) {
        rectDiv.parentElement.removeChild(rectDiv);
      }
    };
  }, [enabled, selectionTool, cesiumViewer, cesiumModifier]);

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
            modifier,
            dblClickAction,
            onMultiSelect: onMultiSelectHandler,
          }
        : NOOP_API,
    [enabled, switchMultiSelect, isMultiSelect, select, reset, unselect, selections, modifier, dblClickAction, onMultiSelectHandler],
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
