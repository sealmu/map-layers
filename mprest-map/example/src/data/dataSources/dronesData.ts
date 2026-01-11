import { Cartesian3, Color } from "cesium";
import { type LayerData } from "@mprest/map";

export const dronesData: LayerData[] = [
  {
    id: "drone1",
    name: "Drone Alpha",
    positions: [Cartesian3.fromDegrees(-95.0, 45.0, 200)], // Minnesota area (no overlaps)
    color: Color.BLACK,
    view: "drones",
    data: { x: -95.0, y: 45.0, z: 200, shape: "drone" },
  },
  {
    id: "drone2",
    name: "Drone Beta",
    positions: [Cartesian3.fromDegrees(-105.0, 40.0, 250)], // Colorado area (no overlaps)
    color: Color.BLUE,
    view: "drones",
    data: { x: -105.0, y: 40.0, z: 250, shape: "drone" },
  },
  {
    id: "drone3",
    name: "Drone Gamma",
    positions: [Cartesian3.fromDegrees(-110.0, 32.0, 180)], // Arizona area (no overlaps)
    color: Color.RED,
    view: "drones",
    data: { x: -110.0, y: 32.0, z: 180, shape: "drone" },
  },
];
