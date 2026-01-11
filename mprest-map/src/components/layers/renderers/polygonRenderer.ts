import { Color, Entity } from "cesium";
import type { LayerData } from "../../../types";

export function createPolygonEntity(
  item: LayerData,
): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    polygon: {
      hierarchy: item.positions, // Array of positions
      material: item.color,
      outline: true,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
    },
  };
}
