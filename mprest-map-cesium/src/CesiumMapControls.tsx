import { Cartesian3, Viewer as CesiumViewer } from "cesium";
import type { IMapConfig } from "@mprest/map-core";

const DEFAULT_CENTER = { longitude: -98.5795, latitude: 39.8283, height: 8000000 };

interface CesiumMapControlsProps {
  viewer: CesiumViewer;
  mapConfig?: IMapConfig;
}

export function CesiumMapControls({ viewer, mapConfig }: CesiumMapControlsProps) {
  return (
    <div className="zoom-controls">
      <button
        className="zoom-button zoom-home"
        onClick={() => {
          const center = mapConfig?.center ?? DEFAULT_CENTER;
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              center.longitude,
              center.latitude,
              center.height ?? 8000000,
            ),
            orientation: mapConfig?.orientation
              ? {
                  heading: mapConfig.orientation.heading ?? 0,
                  pitch: mapConfig.orientation.pitch ?? -90,
                  roll: mapConfig.orientation.roll ?? 0,
                }
              : undefined,
            duration: 1.5,
          });
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9" />
          <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      </button>
      <button
        className="zoom-button zoom-in"
        onClick={() => {
          const height = viewer.camera.positionCartographic.height;
          const zoomAmount = Math.max(height * 0.1, 10000);
          viewer.camera.zoomIn(zoomAmount);
        }}
      >
        +
      </button>
      <button
        className="zoom-button zoom-out"
        onClick={() => {
          const height = viewer.camera.positionCartographic.height;
          const zoomAmount = Math.max(height * 0.1, 10000);
          viewer.camera.zoomOut(zoomAmount);
        }}
      >
        -
      </button>
    </div>
  );
}
