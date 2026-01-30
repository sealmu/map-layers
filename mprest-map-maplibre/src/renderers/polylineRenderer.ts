import type { LayerData, MapLibreFeature } from "../types";
import { toMapLibreColor } from "../adapters/colorAdapter";
import type { Position } from "geojson";

export function createPolylineFeature(item: LayerData): MapLibreFeature {
  const coordinates: Position[] = item.positions.map((p) => [
    p.longitude,
    p.latitude,
    p.height ?? 0,
  ]);

  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "LineString",
      coordinates,
    },
    properties: {
      name: item.name,
      lineColor: toMapLibreColor(item.color),
      lineWidth: 3,
      show: true,
    },
  };
}
