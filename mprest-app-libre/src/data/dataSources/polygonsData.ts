import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const polygonsData: LayerData[] = [
  {
    id: "polygon1",
    positions: [
      { longitude: -105.0, latitude: 40.0 },
      { longitude: -100.0, latitude: 40.0 },
      { longitude: -100.0, latitude: 35.0 },
      { longitude: -105.0, latitude: 35.0 },
      { longitude: -105.0, latitude: 40.0 }, // Close the polygon
    ],
    name: "Colorado Region",
    color: Colors.fromRgb(255, 165, 0), // Orange
    view: "polygons",
  },
  {
    id: "polygon2",
    positions: [
      { longitude: -90.0, latitude: 45.0 },
      { longitude: -85.0, latitude: 45.0 },
      { longitude: -85.0, latitude: 42.0 },
      { longitude: -90.0, latitude: 42.0 },
      { longitude: -90.0, latitude: 45.0 }, // Close the polygon
    ],
    name: "Wisconsin Region",
    color: Colors.fromRgb(128, 0, 128), // Purple
    view: "polygons",
  },
];
