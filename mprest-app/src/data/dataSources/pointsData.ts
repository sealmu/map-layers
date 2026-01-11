import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map";

export const pointsData: LayerData[] = [
  {
    id: "point1",
    positions: [Cartesian3.fromDegrees(-75.59777, 40.03883, 0)],
    name: "Point 1",
    color: Color.RED,
    view: "points",
  },
  {
    id: "point2",
    positions: [Cartesian3.fromDegrees(-80.19773, 25.77481, 0)],
    name: "Point 2",
    color: Color.BLUE,
    view: "points",
  },
  {
    id: "point3",
    positions: [Cartesian3.fromDegrees(-122.4194, 37.7749, 0)],
    name: "Point 3",
    color: Color.GREEN,
    view: "points",
  },
];
