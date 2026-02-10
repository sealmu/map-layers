import { useState, useMemo, useLayoutEffect, useCallback, useRef, useEffect } from "react";
import { Entity, JulianDate } from "cesium";
import { useViewer } from "@mprest/map-core";
import type { MapApi, ZoomApi, MultiSelectApi } from "@mprest/map-cesium";

interface SelectionPanelActions {
  zoom?: ZoomApi;
  multiSelect?: MultiSelectApi;
}

type GroupingMode = "none" | "default" | "layer" | "entity";

interface SelectionPanelProps {
  onEntityClick?: (entity: Entity, actions: SelectionPanelActions) => void;
  onGroupClick?: (groupKey: string, entities: Entity[], actions: SelectionPanelActions) => void;
  /** Grouping strategy: "none" (flat list), "layer" (by DataSource), "entity" (by render type), "default" (custom groupBy or layer). Default: "default" */
  grouping?: GroupingMode;
  /** Custom groupBy function, used when grouping="default". Falls back to layer grouping if not provided. */
  groupBy?: (entity: Entity) => string;
}

const MODIFIER_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
};

const DBL_CLICK_LABELS: Record<string, string> = {
  selectByLayer: "select layer",
  selectByType: "select type",
  selectByLayerAndType: "select layer+type",
};

export function SelectionPanel({ onEntityClick, onGroupClick, grouping = "default", groupBy }: SelectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { viewer } = useViewer();
  const [api, setApi] = useState<MapApi | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smooth wheel scrolling via rAF interpolation (avoids animation queue jank)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let target = el.scrollTop;
    let animating = false;

    const animate = () => {
      const diff = target - el.scrollTop;
      if (Math.abs(diff) < 0.5) {
        el.scrollTop = target;
        animating = false;
        return;
      }
      el.scrollTop += diff * 0.18;
      requestAnimationFrame(animate);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const max = el.scrollHeight - el.clientHeight;
      target = Math.max(0, Math.min(max, target + e.deltaY));
      if (!animating) {
        animating = true;
        requestAnimationFrame(animate);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [expanded]);

  useLayoutEffect(() => {
    if (!viewer) return;
    if (!viewer.handlers?.onApiChange) return;
    return viewer.handlers.onApiChange.subscribe((newApi) => {
      setApi(newApi as MapApi);
    });
  }, [viewer]);

  const zoom = api?.zoom as ZoomApi | undefined;
  const multiSelect = api?.multiSelect as MultiSelectApi | undefined;
  const selections = multiSelect?.selections ?? [];
  const modifier = multiSelect?.modifier;
  const dblClickAction = multiSelect?.dblClickAction;

  // Built-in groupBy strategies
  // Cast to access Cesium's dataSources (not on the provider-agnostic IViewerWithConfigs type)
  const cesiumViewer = viewer as unknown as { dataSources: { length: number; get: (i: number) => { name: string; entities: { getById: (id: string) => unknown } } } } | null;

  const groupByLayer = useCallback((entity: Entity): string => {
    if (!cesiumViewer) return "Other";
    for (let i = 0; i < cesiumViewer.dataSources.length; i++) {
      const ds = cesiumViewer.dataSources.get(i);
      if (ds.name.startsWith("__")) continue;
      if (ds.entities.getById(entity.id)) return ds.name;
    }
    return "Other";
  }, [cesiumViewer]);

  const groupByEntity = useCallback((entity: Entity): string => {
    const rendererType = entity.properties?.getValue?.(JulianDate.now())?.rendererType as string | undefined;
    return rendererType ?? "Other";
  }, []);

  const resolvedGroupBy = useMemo(() => {
    if (grouping === "none") return null;
    if (grouping === "layer") return groupByLayer;
    if (grouping === "entity") return groupByEntity;
    // "default": use custom groupBy prop, or fall back to layer
    return groupBy ?? groupByLayer;
  }, [grouping, groupBy, groupByLayer, groupByEntity]);

  const groups = useMemo(() => {
    if (!resolvedGroupBy) return null; // "none" mode — no grouping
    const map = new Map<string, Entity[]>();
    for (const entity of selections) {
      const key = resolvedGroupBy(entity);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entity);
    }
    return map;
  }, [selections, resolvedGroupBy]);

  if (selections.length === 0) {
    if (!modifier) return null;
    return (
      <div
        style={{
          position: "fixed",
          bottom: "130px",
          right: "50px",
          background:
            "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.8))",
          backdropFilter: "blur(10px)",
          color: "#9ca3af",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          fontSize: "12px",
          fontFamily:
            "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
          fontWeight: "500",
          zIndex: 1000,
          padding: "10px 14px",
        }}
      >
        Multi-select:{" "}
        <span style={{ color: "#29B6F6" }}>{MODIFIER_LABELS[modifier]}</span>
        {" "}+ click or drag
        {dblClickAction && dblClickAction !== "none" && DBL_CLICK_LABELS[dblClickAction] && (
          <>
            <br />
            <span style={{ color: "#29B6F6" }}>{MODIFIER_LABELS[modifier]}</span>
            {" "}+ dbl-click to {DBL_CLICK_LABELS[dblClickAction]}
          </>
        )}
      </div>
    );
  }

  const actions: SelectionPanelActions = { zoom, multiSelect };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "130px",
        right: "50px",
        background:
          "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.8))",
        backdropFilter: "blur(10px)",
        color: "#ffffff",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        fontSize: "13px",
        fontFamily:
          "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
        fontWeight: "500",
        zIndex: 1000,
        minWidth: "180px",
        overflow: "hidden",
      }}
    >
      {/* Header — always visible */}
      <div
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ color: "#29B6F6", marginRight: "8px" }}>
          {selections.length}
        </span>
        <span style={{ color: "#e5e7eb", flex: 1 }}>Selected</span>
        <span
          style={{
            color: "#9ca3af",
            fontSize: "10px",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>

      {/* Expandable list */}
      {expanded && (
        <div
          ref={scrollRef}
          className="selection-panel-scroll"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {groups
            ? /* Grouped mode */
              Array.from(groups.entries()).map(([groupKey, entities]) => (
                <div key={groupKey}>
                  {/* Group header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 14px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      userSelect: "none",
                    }}
                  >
                    <span style={{ color: "#29B6F6", fontSize: "12px", flex: 1 }}>
                      {groupKey}
                      <span style={{ color: "#6b7280", marginLeft: "6px" }}>
                        ({entities.length})
                      </span>
                    </span>
                    {onGroupClick && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupClick(groupKey, entities, actions);
                        }}
                        style={{
                          color: "#9ca3af",
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          transition: "background 0.15s ease, color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(41, 182, 246, 0.2)";
                          e.currentTarget.style.color = "#29B6F6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#9ca3af";
                        }}
                      >
                        &#x25B6;
                      </span>
                    )}
                  </div>

                  {/* Entities in group */}
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 14px 6px 24px",
                        color: "#e5e7eb",
                        fontSize: "12px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(41, 182, 246, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span
                        onClick={() => onEntityClick?.(entity, actions)}
                        style={{ flex: 1, cursor: onEntityClick ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {entity.name || entity.id}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          multiSelect?.unselect(entity.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          color: "#6b7280",
                          fontSize: "16px",
                          cursor: "pointer",
                          marginLeft: "4px",
                          flexShrink: 0,
                          borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248, 113, 113, 0.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; }}
                        title="Remove from selection"
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              ))
            : /* Flat mode (grouping="none") */
              selections.map((entity) => (
                <div
                  key={entity.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    color: "#e5e7eb",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(41, 182, 246, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    onClick={() => onEntityClick?.(entity, actions)}
                    style={{ flex: 1, cursor: onEntityClick ? "pointer" : "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {entity.name || entity.id}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      multiSelect?.unselect(entity.id);
                    }}
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      cursor: "pointer",
                      marginLeft: "8px",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; }}
                    title="Remove from selection"
                  >
                    ×
                  </span>
                </div>
              ))}
          <div
            onClick={() => multiSelect?.reset()}
            style={{
              padding: "8px 14px",
              cursor: "pointer",
              color: "#f87171",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              textAlign: "center",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248, 113, 113, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Unselect All
          </div>
        </div>
      )}
    </div>
  );
}
