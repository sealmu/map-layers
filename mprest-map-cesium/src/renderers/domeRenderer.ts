import { Entity, HeightReference } from "cesium";
import type { LayerData } from "../types";

export function createDomeEntity(item: LayerData): Entity.ConstructorOptions {
  const center = item.positions[0];
  const data = item.data as { radius?: number } | undefined;
  const radius = data?.radius ?? 100000;

  return {
    id: item.id,
    name: item.name,
    position: center,
    ellipse: {
      semiMajorAxis: radius,
      semiMinorAxis: radius,
      material: item.color.withAlpha(0.5),
      outline: true,
      outlineColor: item.color,
      outlineWidth: 2,
      height: 0,
      heightReference: HeightReference.NONE,
    },
  };
}
