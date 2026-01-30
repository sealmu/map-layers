import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const domesData: LayerData[] = [
  {
    id: "dome1",
    positions: [{ longitude: -98.0, latitude: 38.0 }],
    name: "Dome 1",
    color: Colors.CYAN,
    view: "domes",
    data: {
      x: -98.0,
      y: 38.0,
      config: {
        center: [-98.0, 38.0, 0],
        radius: 200000, // meters
        angle: Math.PI * 2,
      },
    },
  },
  {
    id: "dome2",
    positions: [{ longitude: -112.0, latitude: 33.0 }],
    name: "Dome 2",
    color: Colors.MAGENTA,
    view: "domes",
    data: {
      x: -112.0,
      y: 33.0,
      config: {
        center: [-112.0, 33.0, 0],
        radius: 150000, // meters
        angle: Math.PI * 2,
      },
    },
  },
];
