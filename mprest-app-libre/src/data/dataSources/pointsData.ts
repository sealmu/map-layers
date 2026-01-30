import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const pointsData: LayerData[] = [
  {
    id: "point1",
    positions: [{ longitude: -75.59777, latitude: 40.03883 }],
    name: "Point 1",
    color: Colors.RED,
    view: "points",
  },
  {
    id: "point2",
    positions: [{ longitude: -80.19773, latitude: 25.77481 }],
    name: "Point 2",
    color: Colors.BLUE,
    view: "points",
  },
  {
    id: "point3",
    positions: [{ longitude: -122.4194, latitude: 37.7749 }],
    name: "Point 3",
    color: Colors.GREEN,
    view: "points",
  },
];
