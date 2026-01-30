import { Color, Entity, HeightReference } from "cesium";
import type { LayerData } from "../../../types";

export function createPolygonEntity(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    polygon: {
      hierarchy: item.positions,
      material: item.color,
      outline: true,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      height: 0,
      heightReference: HeightReference.NONE,
    },
  };
}
