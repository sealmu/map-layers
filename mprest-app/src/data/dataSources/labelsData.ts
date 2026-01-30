import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map-cesium";

export const labelsData: LayerData[] = [
  {
    id: "label1",
    name: "New York",
    positions: [Cartesian3.fromDegrees(-74.006, 40.7128, 0)],
    color: Color.GREEN,
    view: "labels",
  },
  {
    id: "label2",
    name: "Los Angeles",
    positions: [Cartesian3.fromDegrees(-118.2437, 34.0522, 0)],
    color: Color.GREEN,
    view: "labels",
  },
  {
    id: "label3",
    name: "Chicago",
    positions: [Cartesian3.fromDegrees(-87.6298, 41.8781, 0)],
    color: Color.GREEN,
    view: "labels",
  },
];
