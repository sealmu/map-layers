import { Cartesian3, Color } from "cesium";
import type { LayerData } from "@mprest/map";

export const polygonsData: LayerData[] = [
  {
    id: "polygon1",
    name: "Polygon 1",
    positions: [
      Cartesian3.fromDegrees(-78.0, 38.0, 0),
      Cartesian3.fromDegrees(-72.0, 38.0, 0),
      Cartesian3.fromDegrees(-72.0, 43.0, 0),
      Cartesian3.fromDegrees(-78.0, 43.0, 0),
    ],
    color: Color.YELLOW.withAlpha(0.5),
    view: "polygons",
    data: { x: -75.0, y: 40.5, z: 0, shape: "polygon" },
  },
  {
    id: "polygon2",
    name: "Polygon 2",
    positions: [
      Cartesian3.fromDegrees(-85.0, 22.0, 0),
      Cartesian3.fromDegrees(-78.0, 22.0, 0),
      Cartesian3.fromDegrees(-78.0, 28.0, 0),
      Cartesian3.fromDegrees(-85.0, 28.0, 0),
    ],
    color: Color.CYAN.withAlpha(0.5),
    view: "polygons",
    data: { x: -81.5, y: 25.0, z: 0, shape: "polygon" },
  },
];
