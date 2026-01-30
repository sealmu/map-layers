import { Color, Entity } from "cesium";
import type { LayerData } from "../types";

export function createPointEntity(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    position: item.positions[0],
    point: {
      pixelSize: 10,
      color: item.color,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
  };
}
