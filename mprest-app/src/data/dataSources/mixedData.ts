import { Cartesian2, Cartesian3, Color, Entity } from "cesium";
import type { LayerData } from "@mprest/map-cesium";

export const mixedData: LayerData[] = [
  {
    id: "mixed-point-1",
    positions: [Cartesian3.fromDegrees(-105.0, 42.5, 0)],
    name: "Standard Point",
    color: Color.PURPLE,
    view: "mixed",
    renderType: "points",
  },
  {
    id: "mixed-label-1",
    positions: [Cartesian3.fromDegrees(-92.0, 38.2, 0)],
    name: "Target",
    color: Color.ORANGE,
    view: "mixed",
    renderType: "labels",
  },
  {
    id: "mixed-star-1",
    positions: [Cartesian3.fromDegrees(-78.5, 44.0, 0)],
    name: "Star Marker",
    color: Color.GOLD,
    view: "mixed",
    customRenderer: createStarMarker,
  },
  {
    id: "mixed-polyline-1",
    positions: [
      Cartesian3.fromDegrees(-110.0, 31.5, 0),
      Cartesian3.fromDegrees(-95.5, 29.8, 0),
    ],
    name: "Standard Polyline",
    color: Color.CYAN,
    view: "mixed",
    renderType: "polylines",
  },
  {
    id: "mixed-diamond-1",
    positions: [Cartesian3.fromDegrees(-85.0, 33.5, 0)],
    name: "Diamond Marker",
    color: Color.PURPLE,
    view: "mixed",
    customRenderer: createDiamondMarker,
  },
  {
    id: "mixed-polygon-1",
    positions: [
      Cartesian3.fromDegrees(-72.0, 40.0, 0),
      Cartesian3.fromDegrees(-69.5, 40.0, 0),
      Cartesian3.fromDegrees(-69.5, 42.5, 0),
      Cartesian3.fromDegrees(-72.0, 42.5, 0),
    ],
    name: "Standard Polygon",
    color: Color.LIME.withAlpha(0.5),
    view: "mixed",
    renderType: "polygons",
  },
  {
    id: "mixed-point-2",
    positions: [Cartesian3.fromDegrees(-88.0, 46.8, 0)],
    name: "Another Point",
    color: Color.TEAL,
    view: "mixed",
    renderType: "points",
  },
];

function createStarMarker(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    position: item.positions[0],
    point: {
      pixelSize: 0,
      color: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 3,
    },
    label: {
      text: "⭐",
      font: "32px sans-serif",
      fillColor: Color.YELLOWGREEN,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cartesian2(0, -20),
      style: 0,
    },
  };
}

function createDiamondMarker(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    position: item.positions[0],
    point: {
      pixelSize: 1,
      color: item.color,
      outlineColor: Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: "✹",
      font: "48px sans-serif",
      fillColor: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 1,
      pixelOffset: new Cartesian2(0, -18),
      style: 0,
    },
  };
}
