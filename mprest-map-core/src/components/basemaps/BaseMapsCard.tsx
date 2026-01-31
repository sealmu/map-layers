import { useState, useCallback, useEffect } from "react";
import type { IBaseMapsCardProps, IBaseMapConfig } from "../../types";

interface BaseMapsCardProps extends IBaseMapsCardProps {
  /** Custom CSS class name */
  className?: string;
  /** Whether to show only listed base maps (default: true) */
  showOnlyListed?: boolean;
  /** Enable drag-and-drop reordering (default: true) */
  enableDragDrop?: boolean;
  /** Initial single-select mode (default: false) */
  initialSingleSelect?: boolean;
}

const DefaultBaseMapItem = ({
  baseMap,
  isEnabled,
  onToggle,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  enableDragDrop,
  inputType,
  groupName,
}: {
  baseMap: IBaseMapConfig;
  isEnabled: boolean;
  onToggle: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  enableDragDrop: boolean;
  inputType: "checkbox" | "radio";
  groupName?: string;
}) => (
  <div
    className={`basemap-item ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
    draggable={enableDragDrop}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
      cursor: enableDragDrop ? "grab" : "default",
      opacity: isDragging ? 0.5 : 1,
      backgroundColor: isDragOver ? "rgba(102, 126, 234, 0.1)" : "transparent",
      borderTop: isDragOver ? "2px solid #667eea" : "2px solid transparent",
      transition: "background-color 0.15s ease, border-color 0.15s ease",
    }}
  >
    {enableDragDrop && (
      <div
        className="drag-handle"
        style={{
          marginRight: "8px",
          color: "#999",
          fontSize: "12px",
          cursor: "grab",
        }}
      >
        ⋮⋮
      </div>
    )}
    <div className="basemap-info" style={{ flex: 1 }}>
      <span className="basemap-name" style={{ fontWeight: 500 }}>
        {baseMap.name}
      </span>
      {baseMap.description && (
        <div
          className="basemap-description"
          style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}
        >
          {baseMap.description}
        </div>
      )}
    </div>
    <label
      className="input-label"
      style={{ display: "flex", alignItems: "center", gap: "6px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type={inputType}
        name={groupName}
        checked={isEnabled}
        onChange={onToggle}
      />
    </label>
  </div>
);

const BaseMapsCard = ({
  api,
  header = "Base Maps",
  className,
  showOnlyListed = true,
  renderItem,
  enableDragDrop = true,
  initialSingleSelect = false,
}: BaseMapsCardProps) => {
  const { baseMaps, baseMapStates, toggleBaseMap, enableOnlyBaseMap, reorderBaseMaps } = api;

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [singleSelect, setSingleSelect] = useState(initialSingleSelect);

  const visibleBaseMaps = showOnlyListed
    ? baseMaps.filter((bm) => baseMapStates[bm.id]?.isListed ?? bm.isListed)
    : baseMaps;

  // When switching to single-select mode, keep only the first enabled map
  useEffect(() => {
    if (singleSelect) {
      const enabledMaps = visibleBaseMaps.filter(
        (bm) => baseMapStates[bm.id]?.isEnabled ?? bm.isEnabled
      );
      if (enabledMaps.length > 1) {
        // Keep only the first enabled map
        enableOnlyBaseMap(enabledMaps[0].id);
      }
    }
  }, [singleSelect, visibleBaseMaps, baseMapStates, enableOnlyBaseMap]);

  const handleToggle = useCallback(
    (id: string) => {
      if (singleSelect) {
        enableOnlyBaseMap(id);
      } else {
        toggleBaseMap(id);
      }
    },
    [singleSelect, enableOnlyBaseMap, toggleBaseMap]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      // Get current order from visible base maps
      const currentOrder = visibleBaseMaps.map((bm) => bm.id);
      const fromIndex = currentOrder.indexOf(draggedId);
      const toIndex = currentOrder.indexOf(targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      // Create new order
      const newOrder = [...currentOrder];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, draggedId);

      reorderBaseMaps(newOrder);
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, visibleBaseMaps, reorderBaseMaps]
  );

  if (visibleBaseMaps.length === 0) {
    return null;
  }

  return (
    <div className={`basemaps-card ${className ?? ""}`}>
      {header && (
        <div
          className="basemaps-card-header"
          style={{
            padding: "10px 12px",
            fontWeight: 600,
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{header}</span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 400,
              color: "#666",
              cursor: "pointer",
            }}
            title={singleSelect ? "Single selection mode" : "Multiple selection mode"}
          >
            <span style={{ opacity: singleSelect ? 0.5 : 1 }}>Multi</span>
            <input
              type="checkbox"
              checked={singleSelect}
              onChange={(e) => setSingleSelect(e.target.checked)}
              style={{
                width: "28px",
                height: "14px",
                appearance: "none",
                backgroundColor: singleSelect ? "#667eea" : "#ccc",
                borderRadius: "7px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
            />
            <span style={{ opacity: singleSelect ? 1 : 0.5 }}>Single</span>
            <style>{`
              .basemaps-card input[type="checkbox"]:checked::before,
              .basemaps-card input[type="checkbox"]::before {
                content: "";
                position: absolute;
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: left 0.2s ease;
              }
              .basemaps-card input[type="checkbox"]:checked::before {
                left: 16px;
              }
            `}</style>
          </label>
        </div>
      )}
      <div
        className="basemaps-list"
        style={{
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {visibleBaseMaps.map((baseMap) => {
          const isEnabled =
            baseMapStates[baseMap.id]?.isEnabled ?? baseMap.isEnabled;
          const toggleFn = () => handleToggle(baseMap.id);

          if (renderItem) {
            return (
              <div key={baseMap.id}>
                {renderItem(baseMap, toggleFn, isEnabled)}
              </div>
            );
          }

          return (
            <DefaultBaseMapItem
              key={baseMap.id}
              baseMap={baseMap}
              isEnabled={isEnabled}
              onToggle={toggleFn}
              isDragging={draggedId === baseMap.id}
              isDragOver={dragOverId === baseMap.id}
              onDragStart={() => handleDragStart(baseMap.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, baseMap.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(baseMap.id)}
              enableDragDrop={enableDragDrop}
              inputType={singleSelect ? "radio" : "checkbox"}
              groupName={singleSelect ? "basemap-group" : undefined}
            />
          );
        })}
      </div>
      {enableDragDrop && visibleBaseMaps.length > 1 && !singleSelect && (
        <div
          className="basemaps-card-footer"
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            color: "#999",
            borderTop: "1px solid rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          Drag to reorder (bottom = front)
        </div>
      )}
    </div>
  );
};

export default BaseMapsCard;
