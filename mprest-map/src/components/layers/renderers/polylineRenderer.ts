import { Entity } from "cesium";
import type { LayerData } from "../../../types";

export function createPolylineEntity(
  item: LayerData,
): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    polyline: {
      positions: item.positions, // Array of positions
      width: 4,
      material: item.color,
    },
  };
}
