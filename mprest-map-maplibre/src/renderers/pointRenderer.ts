import type { LayerData, MapLibreFeature } from "../types";
import { toMapLibreColor } from "../adapters/colorAdapter";

export function createPointFeature(item: LayerData): MapLibreFeature {
  const position = item.positions[0];

  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Point",
      coordinates: [position.longitude, position.latitude, position.height ?? 0],
    },
    properties: {
      name: item.name,
      pointColor: toMapLibreColor(item.color),
      pointSize: 10,
      outlineColor: "#ffffff",
      outlineWidth: 2,
      show: true,
    },
  };
}
