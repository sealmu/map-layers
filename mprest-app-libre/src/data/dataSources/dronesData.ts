import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const dronesData: LayerData[] = [
  {
    id: "drone1",
    name: "Drone Alpha",
    positions: [{ longitude: -95.0, latitude: 45.0 }],
    color: Colors.BLACK,
    view: "drones",
  },
  {
    id: "drone2",
    name: "Drone Beta",
    positions: [{ longitude: -105.0, latitude: 40.0 }],
    color: Colors.BLUE,
    view: "drones",
  },
  {
    id: "drone3",
    name: "Drone Gamma",
    positions: [{ longitude: -110.0, latitude: 32.0 }],
    color: Colors.RED,
    view: "drones",
  },
];
