import type { MapLibreFeature, MapClickLocation } from "@mprest/map-maplibre";

export interface EntityPopupInfo {
  feature: MapLibreFeature;
  location?: MapClickLocation;
}

interface EntityPopupProps {
  popupInfo: EntityPopupInfo | null;
  onClose: () => void;
}

export function EntityPopup({ popupInfo, onClose }: EntityPopupProps) {
  if (!popupInfo) return null;

  const { feature, location } = popupInfo;
  const name = feature.properties?.name || feature.id || "Unknown";

  // Position the popup near the click location if available
  const style: React.CSSProperties = {
    position: "absolute",
    top: location?.point ? location.point.y + 10 : "50%",
    left: location?.point ? location.point.x + 10 : "50%",
    transform: location?.point ? "none" : "translate(-50%, -50%)",
  };

  const headerTitle = !location ? "Selection Prevented" : name;

  return (
    <div className="entity-popup" style={style}>
      <div className="entity-popup-header">
        <h3 className="entity-popup-title">{headerTitle}</h3>
        <button className="entity-popup-close" onClick={onClose}>
          x
        </button>
      </div>
      <div className="entity-popup-content">
        <p><strong>ID:</strong> {feature.id}</p>
        <p><strong>Type:</strong> {feature.geometry.type}</p>
        {feature.properties?.color && (
          <p>
            <strong>Color:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: feature.properties.color,
                verticalAlign: "middle",
                marginLeft: "4px",
                border: "1px solid #ccc",
              }}
            />
          </p>
        )}
        {location && (
          <p>
            <strong>Position:</strong> {location.longitude.toFixed(4)}, {location.latitude.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
