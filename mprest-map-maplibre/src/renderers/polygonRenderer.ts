import type { LayerData, MapLibreFeature } from "../types";
import { toMapLibreColor } from "../adapters/colorAdapter";
import type { Position } from "geojson";

export function createPolygonFeature(item: LayerData): MapLibreFeature {
  // MapLibre 2D uses [lng, lat] without altitude
  const ring: Position[] = item.positions.map((p) => [
    p.longitude,
    p.latitude,
  ]);

  // Close the ring if not already closed
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([...first]);
    }
  }

  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
    properties: {
      name: item.name,
      fillColor: toMapLibreColor({ ...item.color, alpha: 0.5 }),
      fillOpacity: 0.5,
      outlineColor: toMapLibreColor(item.color),
      outlineWidth: 2,
      show: true,
    },
  };
}
