import type { ILayerConfig } from "../../types";

type LayerConfig = ILayerConfig;

interface LayerCardProps {
  layer: LayerConfig;
  isDocked: boolean;
  isActive: boolean;
  isVisible: boolean;
  isEnabled?: boolean;
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
  isEnabled = true,
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
      <div className={`docked-layer-item${!isEnabled ? " disabled" : ""}`} onClick={isEnabled ? onToggleDocked : undefined}>
        <span className="docked-layer-name">{layer.name}</span>
        <button
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            if (isEnabled) onToggleDocked();
          }}
          title="Expand to card view"
          disabled={!isEnabled}
        >
          ▼
        </button>
      </div>
    );
  }

  return (
    <div
      className={`layer-item${isHovered ? " hovered" : ""}${!isEnabled ? " disabled" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!hidePin && (
        <button
          className="dock-handle"
          onClick={onToggleDocked}
          title="Dock layer to top"
          onMouseEnter={() => onMouseLeave()} // Clear card hover when hovering over pin
          disabled={!isEnabled}
        >
          📌
        </button>
      )}
      <div className="layer-controls">
        <label className="switch-label">
          <span className="control-name">Active</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isActive}
              onChange={onToggleActive}
              disabled={!isEnabled}
            />
            <span className="slider"></span>
          </label>
        </label>
        <label className="checkbox-label">
          <span className="control-name">Visible</span>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={onToggleVisible}
            disabled={!isEnabled || !isActive}
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
