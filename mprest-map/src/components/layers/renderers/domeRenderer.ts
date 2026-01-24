import { Entity, HeightReference } from "cesium";
import type { LayerData } from "@mprest/map";

export function createDomeEntity(item: LayerData): Entity.ConstructorOptions {
  const center = item.positions[0]; // Assume first position is center
  const data = item.data as { radius?: number } | undefined;
  const radius = data?.radius ?? 100000; // Use data.radius or default

  return {
    id: item.id,
    name: item.name,
    position: center,
    ellipse: {
      semiMajorAxis: radius,
      semiMinorAxis: radius,
      material: item.color.withAlpha(0.5), // Semi-transparent
      outline: true,
      outlineColor: item.color,
      outlineWidth: 2,
      height: 0, // On ground
      heightReference: HeightReference.NONE,
    },
  };
}
