import type { LayerConfig } from "@mprest/map";

interface LayerCardProps {
  layer: LayerConfig;
  isDocked: boolean;
  isActive: boolean;
  isVisible: boolean;
  onToggleActive: () => void;
  onToggleVisible: () => void;
  onToggleDocked: () => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  hidePin?: boolean;
}

const LayerCard = ({
  layer,
  isDocked,
  isActive,
  isVisible,
  onToggleActive,
  onToggleVisible,
  onToggleDocked,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  hidePin = false,
}: LayerCardProps) => {
  if (isDocked) {
    return (
      <div className="docked-layer-item" onClick={onToggleDocked}>
        <span className="docked-layer-name">{layer.name}</span>
        <button
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDocked();
          }}
          title="Expand to card view"
        >
          ▼
        </button>
      </div>
    );
  }

  return (
    <div
      className={`layer-item ${isHovered ? "hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {layer.id !== "street-map" && !hidePin && (
        <button
          className="dock-handle"
          onClick={onToggleDocked}
          title="Dock layer to top"
          onMouseEnter={() => onMouseLeave()} // Clear card hover when hovering over pin
        >
          📌
        </button>
      )}
      <div className="layer-controls">
        {layer.id !== "street-map" && (
          <label className="switch-label">
            <span className="control-name">Active</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isActive}
                onChange={onToggleActive}
              />
              <span className="slider"></span>
            </label>
          </label>
        )}
        <label className="checkbox-label">
          <span className="control-name">Visible</span>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={onToggleVisible}
            disabled={layer.id !== "street-map" && !isActive}
          />
        </label>
      </div>
      <div className="layer-info">
        <span className="layer-name">{layer.name}</span>
        {layer.description && (
          <div className="layer-description">{layer.description}</div>
        )}
      </div>
    </div>
  );
};

export default LayerCard;
