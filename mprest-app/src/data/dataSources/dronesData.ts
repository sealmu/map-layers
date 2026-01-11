import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map";

export const dronesData: LayerData[] = [
  {
    id: "drone1",
    name: "Drone Alpha",
    positions: [Cartesian3.fromDegrees(-95.0, 45.0, 200)],
    color: Color.BLACK,
    view: "drones",
  },
  {
    id: "drone2",
    name: "Drone Beta",
    positions: [Cartesian3.fromDegrees(-105.0, 40.0, 250)],
    color: Color.BLUE,
    view: "drones",
  },
  {
    id: "drone3",
    name: "Drone Gamma",
    positions: [Cartesian3.fromDegrees(-110.0, 32.0, 180)],
    color: Color.RED,
    view: "drones",
  },
];
