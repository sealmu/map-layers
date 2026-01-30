import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map-cesium";

export const domesData: LayerData[] = [
  {
    id: "dome1",
    positions: [Cartesian3.fromDegrees(-84.006, 51.0, 0)], // Moved north of New York City
    name: "NYC Dome",
    color: Color.GREEN,
    view: "domes",
    data: {
      radius: 350000, // 50km radius
    },
  },
  {
    id: "dome2",
    positions: [Cartesian3.fromDegrees(-120.006, 46.0, 0)], // Moved north of New York City
    name: "NYC Dome",
    color: Color.BLUE,
    view: "domes",
    data: {
      radius: 250000, // 50km radius
    },
  },
];
