import { Cartesian2, Entity } from "cesium";
import type { MapClickLocation } from "@mprest/map";

export interface EntityPopupInfo {
  entity: Entity;
  location?: MapClickLocation;
  screenPosition?: Cartesian2;
}

interface EntityPopupProps {
  popupInfo: EntityPopupInfo | null;
  popupPosition: { left: number; top: number } | null;
  onClose: () => void;
}

export function EntityPopup({ popupInfo, popupPosition, onClose }: EntityPopupProps) {
  if (!popupInfo) return null;

  return (
    <div
      className="entity-popup"
      style={{
        position: !popupInfo.location ? "fixed" : "absolute",
        ...(!popupInfo.location
          ? {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }
          : {
            top: `${popupPosition!.top}px`,
            left: `${popupPosition!.left}px`,
          }),
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        padding: "16px",
        borderRadius: "8px",
        minWidth: "250px",
        maxWidth: "350px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        zIndex: 3000,
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>{!popupInfo.location ? "Selection Prevented" : "Entity Info"}</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          ×
        </button>
      </div>
      <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
        <div><strong>ID:</strong> {popupInfo.entity.id}</div>
        <div><strong>Name:</strong> {popupInfo.entity.name || "N/A"}</div>
        {popupInfo.location && (
          <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "8px" }}>
            <strong>Location:</strong>
            <div style={{ marginLeft: "8px", fontSize: "13px" }}>
              <div>Lat: {popupInfo.location.latitude.toFixed(6)}°</div>
              <div>Lon: {popupInfo.location.longitude.toFixed(6)}°</div>
              <div>Height: {popupInfo.location.height.toFixed(2)}m</div>
            </div>
          </div>
        )}
        {!popupInfo.location && (
          <div style={{ marginTop: "8px", color: "#ff6b6b" }}>
            <strong>Selection of this entity is not allowed.</strong>
          </div>
        )}
      </div>
    </div>
  );
}