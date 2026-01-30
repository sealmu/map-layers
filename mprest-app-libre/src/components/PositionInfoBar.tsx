import type { MapClickLocation } from "@mprest/map-maplibre";

interface PositionInfoBarProps {
  position: MapClickLocation | null;
}

export function PositionInfoBar({ position }: PositionInfoBarProps) {
  if (!position) return null;

  return (
    <div className="position-info-bar">
      Lng: {position.longitude.toFixed(4)} | Lat: {position.latitude.toFixed(4)}
    </div>
  );
}
