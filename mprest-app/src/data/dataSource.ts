import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map-cesium";
import { pointsData } from "./dataSources/pointsData";
import { labelsData } from "./dataSources/labelsData";
import { polygonsData } from "./dataSources/polygonsData";
import { polylinesData } from "./dataSources/polylinesData";
import { dronesData } from "./dataSources/dronesData";
import { mixedData } from "./dataSources/mixedData";
import { domesData } from "./dataSources/domesData";

export const dataSource: LayerData[] = [
  ...pointsData,
  ...labelsData,
  ...polygonsData,
  ...polylinesData,
  ...dronesData,
  ...mixedData,
  ...domesData,
  // Radar data
  {
    id: "radar1",
    name: "Radar 1",
    color: Color.YELLOW,
    positions: [Cartesian3.fromDegrees(-98.5795, 39.8283, 1000)],
    view: "cones",
    renderType: "cone",
    data: {
      x: -98.5795,
      y: 39.8283,
      config: {
        center: [-98.5795, 39.8283, 1000],
        radius: 1500000,
        coneAngle: Math.PI / 12, // 30 degrees semi-angle (60 degrees full)
      },
    },
  },
];
