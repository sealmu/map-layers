import { Cartesian2, Color, Entity } from "cesium";
import type { LayerData } from "@mprest/map-cesium";

export function createLabelEntity(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    position: item.positions[0],
    label: {
      text: item.name,
      font: "24px sans-serif",
      fillColor: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 3,
      pixelOffset: new Cartesian2(0, -25),
    },
    point: {
      pixelSize: 10,
      color: item.color,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
  };
}
