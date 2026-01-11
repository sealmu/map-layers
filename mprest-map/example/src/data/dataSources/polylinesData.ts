import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map";

export const polylinesData: LayerData[] = [
  {
    id: "polyline1",
    name: "Route 1",
    positions: [
      Cartesian3.fromDegrees(-122.4194, 37.7749, 0),
      Cartesian3.fromDegrees(-118.2437, 34.0522, 0),
      Cartesian3.fromDegrees(-115.1398, 36.1699, 0),
    ],
    color: Color.ORANGE,
    view: "polylines",
    data: { x: -118.6, y: 36.0, z: 0, shape: "polyline" },
  },
  {
    id: "polyline2",
    name: "Route 2",
    positions: [
      Cartesian3.fromDegrees(-73.9352, 40.7306, 0),
      Cartesian3.fromDegrees(-77.0369, 38.9072, 0),
      Cartesian3.fromDegrees(-80.1918, 25.7617, 0),
    ],
    color: Color.PURPLE,
    view: "polylines",
    data: { x: -77.0, y: 35.1, z: 0, shape: "polyline" },
  },
];
