import type { MapClickLocation } from "@mprest/map-cesium";

interface PositionInfoBarProps {
  position: MapClickLocation | null;
}

export function PositionInfoBar({ position }: PositionInfoBarProps) {
  // Create a key that changes when position updates to trigger animation
  const animationKey = position ? `${position.latitude}-${position.longitude}-${position.height}` : 'no-position';

  if (!position) return null;

  return (
    <>
      <style>
        {`
          @keyframes coordinateUpdate {
            0% { 
              opacity: 1; 
              transform: translateY(0); 
            }
            50% { 
              opacity: 0.8; 
              transform: translateY(-1px); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          .coordinate-text {
            animation: coordinateUpdate 0.4s ease-out;
            animation-fill-mode: forwards;
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          bottom: "50px",
          right: "50px",
          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.8))",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          fontSize: "13px",
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
          fontWeight: "500",
          zIndex: 1000,
          pointerEvents: "none",
          minWidth: "180px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#4ade80", fontSize: "11px" }}>📍</span>
            <span
              key={`lat-${animationKey}`}
              className="coordinate-text"
              style={{ color: "#e5e7eb" }}
            >
              {position.latitude.toFixed(6)}°
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#60a5fa", fontSize: "11px" }}>📍</span>
            <span
              key={`lon-${animationKey}`}
              className="coordinate-text"
              style={{ color: "#e5e7eb" }}
            >
              {position.longitude.toFixed(6)}°
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#fbbf24", fontSize: "11px" }}>📏</span>
            <span
              key={`alt-${animationKey}`}
              className="coordinate-text"
              style={{ color: "#e5e7eb" }}
            >
              {position.height.toFixed(2)}m
            </span>
          </div>
        </div>
      </div>
    </>
  );
}