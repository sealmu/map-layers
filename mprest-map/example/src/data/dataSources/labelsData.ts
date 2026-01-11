import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map";

export const labelsData: LayerData[] = [
  {
    id: "label1",
    name: "New York",
    positions: [Cartesian3.fromDegrees(-74.006, 40.7128, 0)],
    color: Color.GREEN,
    view: "labels",
    data: { x: -74.006, y: 40.7128, z: 0, shape: "label" },
  },
  {
    id: "label2",
    name: "Los Angeles",
    positions: [Cartesian3.fromDegrees(-118.2437, 34.0522, 0)],
    color: Color.GREEN,
    view: "labels",
    data: { x: -118.2437, y: 34.0522, z: 0, shape: "label" },
  },
  {
    id: "label3",
    name: "Chicago",
    positions: [Cartesian3.fromDegrees(-87.6298, 41.8781, 0)],
    color: Color.GREEN,
    view: "labels",
    data: { x: -87.6298, y: 41.8781, z: 0, shape: "label" },
  },
];
