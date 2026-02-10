import React, { useState, useLayoutEffect, useMemo, useCallback } from "react";
import { useCesiumViewer } from "@mprest/map-cesium";
import type { MapApi, MultiSelectApi } from "@mprest/map-cesium";

const MAX_VISIBLE = 8;

const TYPE_COLORS: Record<string, string> = {
  points: "#1976D2",
  polylines: "#F57C00",
  polygons: "#388E3C",
  labels: "#7B1FA2",
  domes: "#0097A7",
  cone: "#D32F2F",
  custom: "#757575",
};

type HoverState = { entities: Array<{ id: string; name: string; type?: string }>; layerId: string; x: number; y: number };

interface ClusterTooltipProps {
  onAction?: (entity: { id: string; name: string; type?: string }, layerId: string) => void;
  onAllActions?: (entities: Array<{ id: string; name: string; type?: string }>, layerId: string) => void;
}

export function ClusterTooltip({ onAction, onAllActions }: ClusterTooltipProps) {
  const { viewer } = useCesiumViewer();
  const [api, setApi] = useState<MapApi | undefined>(undefined);
  const [pinned, setPinned] = useState<HoverState | null>(null);
  // Subscribe to API changes (same pattern as SelectionPanel)
  useLayoutEffect(() => {
    if (!viewer?.handlers?.onApiChange) return;
    return viewer.handlers.onApiChange.subscribe((newApi) => {
      setApi(newApi as MapApi);
    });
  }, [viewer]);

  // Read hover state directly from API (updates when API object changes)
  const hoverState = api?.cluster?.hoverState ?? null;
  // Use pinned data when mouse is inside the tooltip, otherwise live hover state
  const tooltip = pinned ?? hoverState;

  const multiSelect = api?.multiSelect as MultiSelectApi | undefined;
  const selections = multiSelect?.selections;
  const selectedIds = useMemo(() => {
    const set = new Set<string>();
    if (selections) {
      for (const e of selections) set.add(e.id);
    }
    return set;
  }, [selections]);

  const handleMouseEnter = useCallback(() => {
    // Pin current tooltip data so it stays visible when mouse leaves the billboard
    const live = hoverState;
    if (live) setPinned(live);
  }, [hoverState]);

  const handleMouseLeave = useCallback(() => {
    setPinned(null);
  }, []);

  const toggleSelection = useCallback((entityId: string) => {
    if (!multiSelect) return;
    if (selectedIds.has(entityId)) {
      multiSelect.unselect(entityId);
    } else {
      multiSelect.select(entityId);
    }
  }, [multiSelect, selectedIds]);

  if (!tooltip) return null;

  const remaining = tooltip.entities.length - MAX_VISIBLE;
  const selectedInCluster = tooltip.entities.filter((e) => selectedIds.has(e.id)).length;
  const isInteractive = pinned !== null;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        left: tooltip.x + 16,
        top: tooltip.y,
        transform: "translateY(-50%)",
        background: "#ffffff",
        color: "#212121",
        borderRadius: "8px",
        boxShadow:
          "0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.14), 0 1px 18px rgba(0,0,0,0.12)",
        padding: "8px 0",
        fontSize: "13px",
        fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
        fontWeight: 400,
        zIndex: 10000,
        minWidth: "160px",
        maxWidth: "260px",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          padding: "4px 16px 8px",
          fontSize: "11px",
          color: "#1976D2",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid #E0E0E0",
          marginBottom: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{tooltip.entities.length} entities</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedInCluster > 0 && (
            <span style={{ color: "#43A047", fontSize: "11px" }}>
              {selectedInCluster} selected
            </span>
          )}
          {onAllActions && (
            <span
              onClick={() => onAllActions(tooltip.entities, tooltip.layerId)}
              style={{
                cursor: "pointer",
                fontSize: "13px",
                color: "#1976D2",
                lineHeight: 1,
              }}
              title="Action on all"
            >
              ▶
            </span>
          )}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr auto 20px",
        columnGap: "10px",
        padding: "0 12px 0 6px",
        color: "#424242",
        lineHeight: "1.4",
      }}>
        {tooltip.entities.slice(0, MAX_VISIBLE).map((e) => {
          const isSelected = selectedIds.has(e.id);
          return (
            <React.Fragment key={e.id}>
              <span
                onClick={() => toggleSelection(e.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  width: 14,
                  height: 14,
                  borderRadius: "2px",
                  background: isSelected ? "#43A047" : "#E0E0E0",
                  alignSelf: "center",
                  color: "#fff",
                  fontSize: "10px",
                  lineHeight: 1,
                }}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span
                onClick={() => toggleSelection(e.id)}
                style={{
                  padding: "4px 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "#1B5E20" : "#424242",
                  cursor: "pointer",
                }}
              >
                {e.name}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 0",
                }}
              >
                {e.type && (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: TYPE_COLORS[e.type] ?? "#BDBDBD",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#9E9E9E" }}>
                      {e.type}
                    </span>
                  </>
                )}
              </span>
              <span
                onClick={() => onAction?.(e, tooltip.layerId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: onAction ? "pointer" : "default",
                  fontSize: "11px",
                  color: "#9E9E9E",
                  padding: "4px 0",
                }}
                title="Action"
              >
                ▶
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {remaining > 0 && (
        <div
          style={{
            padding: "4px 16px",
            color: "#9E9E9E",
            fontSize: "12px",
          }}
        >
          +{remaining} more
        </div>
      )}

      {isInteractive && (
        <div
          style={{
            padding: "4px 16px 2px",
            fontSize: "10px",
            color: "#BDBDBD",
            textAlign: "center",
            borderTop: "1px solid #F5F5F5",
            marginTop: "4px",
          }}
        >
          click to toggle selection
        </div>
      )}
    </div>
  );
}
