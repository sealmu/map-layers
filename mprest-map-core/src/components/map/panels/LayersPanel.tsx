import { useState, useMemo } from "react";
import LayerCard from "../../layers/LayerCard";
import type { ILayersPanelProps, ILayerConfig } from "../../../types";

type LayersPanelProps = ILayersPanelProps;
type LayerConfig = ILayerConfig;

const LayersPanel = ({ api, onFilter, onSearch }: LayersPanelProps) => {
  const {
    layerConfigs,
    layerStates,
    toggleLayerActive,
    toggleLayerVisible,
    toggleActiveAll,
    toggleVisibleAll,
    toggleLayerDocked,
    toggleGroupActive,
    toggleGroupVisible,
    toggleGroupDocked,
  } = api;

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isGrouped, setIsGrouped] = useState(false);

  const groupedLayers = useMemo(() => {
    const groups: Record<string, { groupName: string; layers: LayerConfig[] }> = {};
    const ungrouped: LayerConfig[] = [];
    layerConfigs.forEach((layer: LayerConfig) => {
      if (layer.group) {
        if (!groups[layer.group]) {
          groups[layer.group] = { groupName: layer.groupName || layer.group, layers: [] };
        }
        groups[layer.group].layers.push(layer);
      } else {
        ungrouped.push(layer);
      }
    });
    return { groups, ungrouped };
  }, [layerConfigs]);
  const activeCount = layerConfigs.filter(
    (layer: LayerConfig) =>
      layer.id !== "street-map" && (layerStates[layer.id]?.isActive ?? false),
  ).length;
  const allActive =
    activeCount === layerConfigs.filter((layer: LayerConfig) => layer.id !== "street-map").length;
  const someActive = activeCount > 0 && !allActive;
  const visibleCount = layerConfigs.filter(
    (layer: LayerConfig) =>
      layer.id !== "street-map" && (layerStates[layer.id]?.isVisible ?? false),
  ).length;
  const allVisible =
    visibleCount === layerConfigs.filter((layer: LayerConfig) => layer.id !== "street-map").length;

  return (
    <div className="layer-control">
      <div className="layer-control-header">
        <div className="header-left">
          <button
            className={`grouped-toggle-button${isGrouped ? " active" : ""}`}
            onClick={() => setIsGrouped(!isGrouped)}
          >
            {isGrouped ? "Grouped" : "Ungrouped"}
          </button>
          <h3>Layers</h3>
          {/* Docked Layers Bar */}
          {layerConfigs.some((layer: LayerConfig) => layerStates[layer.id]?.isDocked) && (
            <div className="docked-layers-bar">
              {(() => {
                if (isGrouped) {
                  const dockedGroups: Record<string, { groupName: string; layers: LayerConfig[] }> = {};
                  const dockedUngrouped: LayerConfig[] = [];
                  layerConfigs.filter((layer: LayerConfig) => layerStates[layer.id]?.isDocked).forEach((layer) => {
                    if (layer.group) {
                      if (!dockedGroups[layer.group]) {
                        dockedGroups[layer.group] = { groupName: layer.groupName || layer.group, layers: [] };
                      }
                      dockedGroups[layer.group].layers.push(layer);
                    } else {
                      dockedUngrouped.push(layer);
                    }
                  });
                  return (
                    <>
                      {Object.entries(dockedGroups).map(([groupKey, group]) => (
                        <div key={groupKey} className="docked-layer-item" onClick={() => toggleGroupDocked(groupKey)}>
                          <span className="docked-layer-name">{group.groupName}</span>
                          <button
                            className="expand-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupDocked(groupKey);
                            }}
                            title="Undock group"
                          >
                            ▼
                          </button>
                        </div>
                      ))}
                      {dockedUngrouped.map((layer) => (
                        <LayerCard
                          key={layer.id}
                          layer={layer}
                          isDocked={layerStates[layer.id]?.isDocked ?? false}
                          isActive={layerStates[layer.id]?.isActive ?? false}
                          isVisible={layerStates[layer.id]?.isVisible ?? false}
                          onToggleActive={() => toggleLayerActive(layer.id)}
                          onToggleVisible={() => toggleLayerVisible(layer.id)}
                          onToggleDocked={() => toggleLayerDocked(layer.id)}
                          isHovered={false} // Docked items don't hover
                          onMouseEnter={() => { }}
                          onMouseLeave={() => { }}
                        />
                      ))}
                    </>
                  );
                } else {
                  return layerConfigs
                    .filter((layer: LayerConfig) => layerStates[layer.id]?.isDocked)
                    .map((layer: LayerConfig) => (
                      <LayerCard
                        key={layer.id}
                        layer={layer}
                        isDocked={layerStates[layer.id]?.isDocked ?? false}
                        isActive={layerStates[layer.id]?.isActive ?? false}
                        isVisible={layerStates[layer.id]?.isVisible ?? false}
                        onToggleActive={() => toggleLayerActive(layer.id)}
                        onToggleVisible={() => toggleLayerVisible(layer.id)}
                        onToggleDocked={() => toggleLayerDocked(layer.id)}
                        isHovered={false} // Docked items don't hover
                        onMouseEnter={() => { }}
                        onMouseLeave={() => { }}
                      />
                    ));
                }
              })()}
            </div>
          )}
        </div>
        <div className="bulk-controls">
          {onFilter && (
            <button
              className="bulk-button"
              onClick={onFilter}
            >
              Filter
            </button>
          )}
          {onSearch && (
            <button
              className="bulk-button"
              onClick={onSearch}
            >
              Search
            </button>
          )}
          <button
            className={`bulk-button${allActive ? " checked" : someActive ? " partial" : ""
              }`}
            onClick={toggleActiveAll}
            aria-checked={allActive}
          >
            All Active
          </button>
          <button
            className={`bulk-button${allVisible ? " checked" : ""}`}
            onClick={toggleVisibleAll}
            aria-checked={allVisible}
          >
            All Visible
          </button>
        </div>
      </div>
      <div className="layer-list">
        {isGrouped ? (
          <>
            {/* Ungrouped layers */}
            {groupedLayers.ungrouped
              .filter((layer) => !layer.isDocked)
              .map((layer) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  isDocked={layer.isDocked ?? false}
                  isActive={layerStates[layer.id]?.isActive ?? false}
                  isVisible={layerStates[layer.id]?.isVisible ?? false}
                  onToggleActive={() => toggleLayerActive(layer.id)}
                  onToggleVisible={() => toggleLayerVisible(layer.id)}
                  onToggleDocked={() => toggleLayerDocked(layer.id)}
                  isHovered={hoveredCard === layer.id}
                  onMouseEnter={() => setHoveredCard(layer.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                />
              ))}
            {/* Grouped layers */}
            {Object.entries(groupedLayers.groups).map(([groupKey, group]) => {
              const groupLayers = group.layers;
              if (groupLayers.length === 0) return null;

              // If all layers in the group are docked, don't show the group card
              const isGroupDocked = groupLayers.every(layer => layerStates[layer.id]?.isDocked);
              if (isGroupDocked) return null;

              const someActive = groupLayers.some((layer) => layerStates[layer.id]?.isActive ?? false);
              const allVisible = groupLayers.every((layer) => layerStates[layer.id]?.isVisible ?? false);
              const someVisible = groupLayers.some((layer) => layerStates[layer.id]?.isVisible ?? false);

              return (
                <div key={groupKey} className="layer-group">
                  <button
                    className="group-dock-handle"
                    onClick={() => toggleGroupDocked(groupKey)}
                    title="Dock group to top"
                  >
                    📌
                  </button>
                  <div className="group-header">
                    <span className="group-name">{group.groupName}</span>
                    <div className="group-controls">
                      <label className="switch-label">
                        <span className="control-name">Active</span>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={someActive}
                            onChange={() => toggleGroupActive(groupKey)}
                          />
                          <span className="slider"></span>
                        </label>
                      </label>
                      <label className="checkbox-label">
                        <span className="control-name">Visible</span>
                        <input
                          type="checkbox"
                          checked={allVisible}
                          ref={(el) => {
                            if (el) el.indeterminate = someVisible && !allVisible;
                          }}
                          onChange={() => toggleGroupVisible(groupKey)}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="group-layers">
                    {groupLayers.map((layer) => (
                      <LayerCard
                        key={layer.id}
                        layer={layer}
                        isDocked={false}
                        isActive={layerStates[layer.id]?.isActive ?? false}
                        isVisible={layerStates[layer.id]?.isVisible ?? false}
                        onToggleActive={() => toggleLayerActive(layer.id)}
                        onToggleVisible={() => toggleLayerVisible(layer.id)}
                        onToggleDocked={() => { }}
                        isHovered={hoveredCard === layer.id}
                        onMouseEnter={() => setHoveredCard(layer.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        hidePin={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          layerConfigs
            .filter((layer: LayerConfig) => !layer.isDocked)
            .map((layer: LayerConfig) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                isDocked={layer.isDocked ?? false}
                isActive={layerStates[layer.id]?.isActive ?? false}
                isVisible={layerStates[layer.id]?.isVisible ?? false}
                onToggleActive={() => toggleLayerActive(layer.id)}
                onToggleVisible={() => toggleLayerVisible(layer.id)}
                onToggleDocked={() => toggleLayerDocked(layer.id)}
                isHovered={hoveredCard === layer.id}
                onMouseEnter={() => setHoveredCard(layer.id)}
                onMouseLeave={() => setHoveredCard(null)}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
