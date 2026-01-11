import { Cartesian3, Color, Cartesian2, Entity } from "cesium";
import { type LayerData } from "@mprest/map";

// Mixed data with different render types and custom renderers
export const mixedData: LayerData[] = [
  // Point with standard point renderer
  {
    id: "mixed-point-1",
    positions: [Cartesian3.fromDegrees(-105.0, 42.5, 0)],
    name: "Standard Point",
    color: Color.PURPLE,
    renderType: "points",
    view: "mixed",
    data: { x: -105.0, y: 42.5, z: 0, shape: "point" },
  },
  // Label with standard label renderer
  {
    id: "mixed-label-1",
    positions: [Cartesian3.fromDegrees(-92.0, 38.2, 0)],
    name: "Target",
    color: Color.ORANGE,
    renderType: "labels",
    view: "mixed",
    data: { x: -92.0, y: 38.2, z: 0, shape: "label" },
  },
  // Custom star marker
  {
    id: "mixed-star-1",
    positions: [Cartesian3.fromDegrees(-78.5, 44.0, 0)],
    name: "Star Marker",
    color: Color.GOLD,
    customRenderer: createStarMarker,
    view: "mixed",
    data: { x: -78.5, y: 44.0, z: 0, shape: "star" },
  },
  // Polyline with standard polyline renderer
  {
    id: "mixed-polyline-1",
    positions: [
      Cartesian3.fromDegrees(-110.0, 31.5, 0),
      Cartesian3.fromDegrees(-95.5, 29.8, 0),
    ],
    name: "Standard Polyline",
    color: Color.CYAN,
    renderType: "polylines",
    view: "mixed",
    data: { x: -102.75, y: 30.65, z: 0, shape: "polyline" },
  },
  // Custom diamond marker
  {
    id: "mixed-diamond-1",
    positions: [Cartesian3.fromDegrees(-85.0, 33.5, 0)],
    name: "Diamond Marker",
    color: Color.PURPLE,
    customRenderer: createDiamondMarker,
    view: "mixed",
    data: { x: -85.0, y: 33.5, z: 0, shape: "diamond" },
  },
  // Polygon with standard polygon renderer
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
    renderType: "polygons",
    view: "mixed",
    data: { x: -70.75, y: 41.25, z: 0, shape: "polygon" },
  },
  // Another point with different color
  {
    id: "mixed-point-2",
    positions: [Cartesian3.fromDegrees(-88.0, 46.8, 0)],
    name: "Another Point",
    color: Color.TEAL,
    renderType: "points",
    view: "mixed",
    data: { x: -88.0, y: 46.8, z: 0, shape: "point" },
  },
];

// Custom renderer for a special marker
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
      style: 0, // LabelStyle.FILL_AND_OUTLINE
    },
  };
}

// Custom renderer for a diamond marker
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
      text: "❄️",
      font: "48px sans-serif",
      fillColor: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 1,
      pixelOffset: new Cartesian2(0, -18),
      style: 0,
    },
  };
}
