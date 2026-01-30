import type { LayerData, MapLibreFeature } from "../types";
import { toMapLibreColor } from "../adapters/colorAdapter";

export function createLabelFeature(item: LayerData): MapLibreFeature {
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
      labelText: item.name,
      labelColor: toMapLibreColor(item.color),
      labelSize: 14,
      labelFont: "Open Sans Regular",
      show: true,
    },
  };
}
