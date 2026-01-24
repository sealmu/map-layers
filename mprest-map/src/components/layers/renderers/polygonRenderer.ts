import { Color, Entity, HeightReference } from "cesium";
import type { LayerData } from "@mprest/map";

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
      height: 0, // Disable terrain clamping to enable outlines
      heightReference: HeightReference.NONE,
    },
  };
}
