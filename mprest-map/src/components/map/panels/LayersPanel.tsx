import type { LayersPanelProps } from "../../../types";
import { useState } from "react";
import LayerCard from "../../layers/LayerCard";

const LayersPanel = ({ api, onFilter }: LayersPanelProps) => {
  const {
    layers,
    layerStates,
    toggleLayerActive,
    toggleLayerVisible,
    toggleActiveAll,
    toggleVisibleAll,
    toggleLayerDocked,
  } = api;

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const activeCount = layers.filter(
    (layer) =>
      layer.id !== "street-map" && (layerStates[layer.id]?.isActive ?? false),
  ).length;
  const allActive =
    activeCount === layers.filter((layer) => layer.id !== "street-map").length;
  const someActive = activeCount > 0 && !allActive;
  const visibleCount = layers.filter(
    (layer) =>
      layer.id !== "street-map" && (layerStates[layer.id]?.isVisible ?? false),
  ).length;
  const allVisible =
    visibleCount === layers.filter((layer) => layer.id !== "street-map").length;

  return (
    <div className="layer-control">
      <div className="layer-control-header">
        <div className="header-left">
          <h3>Layers</h3>
          {/* Docked Layers Bar */}
          {layers.some((layer) => layer.isDocked) && (
            <div className="docked-layers-bar">
              {layers
                .filter((layer) => layer.isDocked)
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
                    isHovered={false} // Docked items don't hover
                    onMouseEnter={() => { }}
                    onMouseLeave={() => { }}
                  />
                ))}
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
        {layers
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
      </div>
    </div>
  );
};

export default LayersPanel;
