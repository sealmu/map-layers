import { useState, useLayoutEffect } from "react";
import { Entity } from "cesium";
import { useViewer } from "@mprest/map-core";
import type { MapApi, ZoomApi, MultiSelectApi } from "@mprest/map-cesium";

interface SelectionPanelActions {
  zoom?: ZoomApi;
  multiSelect?: MultiSelectApi;
}

interface SelectionPanelProps {
  onEntityClick?: (entity: Entity, actions: SelectionPanelActions) => void;
  modifier?: "ctrl" | "shift" | "alt";
}

const MODIFIER_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
};

export function SelectionPanel({ onEntityClick, modifier }: SelectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { viewer } = useViewer();
  const [api, setApi] = useState<MapApi | undefined>(undefined);

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
      </div>
    );
  }

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
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {selections.map((entity) => (
            <div
              key={entity.id}
              onClick={() => onEntityClick?.(entity, { zoom, multiSelect })}
              style={{
                padding: "8px 14px",
                cursor: zoom ? "pointer" : "default",
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
              {entity.name || entity.id}
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
