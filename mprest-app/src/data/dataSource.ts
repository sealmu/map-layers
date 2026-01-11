import type { LayerData } from "@mprest/map";
import { pointsData } from "./dataSources/pointsData";
import { labelsData } from "./dataSources/labelsData";
import { polygonsData } from "./dataSources/polygonsData";
import { polylinesData } from "./dataSources/polylinesData";
import { dronesData } from "./dataSources/dronesData";
import { mixedData } from "./dataSources/mixedData";

export const dataSource: LayerData[] = [
  ...pointsData,
  ...labelsData,
  ...polygonsData,
  ...polylinesData,
  ...dronesData,
  ...mixedData,
];
