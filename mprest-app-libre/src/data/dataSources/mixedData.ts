import type { LayerData, MapLibreFeature } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const mixedData: LayerData[] = [
  // Point
  {
    id: "mixed-point",
    positions: [{ longitude: -105.0, latitude: 42.5 }],
    name: "Standard Point",
    color: Colors.fromRgb(128, 0, 128),
    view: "mixed",
    renderType: "points",
  },
  // Label
  {
    id: "mixed-label",
    positions: [{ longitude: -92.0, latitude: 38.2 }],
    name: "Target",
    color: Colors.fromRgb(255, 165, 0),
    view: "mixed",
    renderType: "labels",
  },
  // Star marker
  {
    id: "mixed-star",
    positions: [{ longitude: -78.5, latitude: 44.0 }],
    name: "Star Marker",
    color: Colors.YELLOW,
    view: "mixed",
    customRenderer: createStarMarker,
  },
  // Polyline
  {
    id: "mixed-polyline",
    positions: [
      { longitude: -110.0, latitude: 31.5 },
      { longitude: -95.5, latitude: 29.8 },
    ],
    name: "Standard Polyline",
    color: Colors.CYAN,
    view: "mixed",
    renderType: "polylines",
  },
  // Diamond marker
  {
    id: "mixed-diamond",
    positions: [{ longitude: -85.0, latitude: 33.5 }],
    name: "Diamond Marker",
    color: Colors.fromRgb(128, 0, 128),
    view: "mixed",
    customRenderer: createDiamondMarker,
  },
  // Polygon
  {
    id: "mixed-polygon",
    positions: [
      { longitude: -72.0, latitude: 40.0 },
      { longitude: -69.5, latitude: 40.0 },
      { longitude: -69.5, latitude: 42.5 },
      { longitude: -72.0, latitude: 42.5 },
      { longitude: -72.0, latitude: 40.0 },
    ],
    name: "Standard Polygon",
    color: Colors.GREEN,
    view: "mixed",
    renderType: "polygons",
  },
  // Another point
  {
    id: "mixed-point-2",
    positions: [{ longitude: -88.0, latitude: 46.8 }],
    name: "Another Point",
    color: Colors.CYAN,
    view: "mixed",
    renderType: "points",
  },
];

// SVG star icon (yellow with black outline)
const starIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12"
    fill="#FFD700" stroke="#000000" stroke-width="2"/>
</svg>`;
const starIconData = `data:image/svg+xml;base64,${btoa(starIconSvg)}`;

// SVG diamond icon (purple with white outline)
const diamondIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <polygon points="16,2 30,16 16,30 2,16"
    fill="#800080" stroke="#ffffff" stroke-width="2"/>
</svg>`;
const diamondIconData = `data:image/svg+xml;base64,${btoa(diamondIconSvg)}`;

function createStarMarker(item: LayerData): MapLibreFeature {
  const pos = item.positions[0];
  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Point",
      coordinates: [pos.longitude, pos.latitude],
    },
    properties: {
      name: item.name,
      labelText: item.name,
      icon: "star-marker",
      iconData: starIconData,
      iconSize: 1,
      pointColor: "rgba(0,0,0,0)",
      pointSize: 0,
      rendererType: "star",
      show: true,
    },
  };
}

function createDiamondMarker(item: LayerData): MapLibreFeature {
  const pos = item.positions[0];
  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Point",
      coordinates: [pos.longitude, pos.latitude],
    },
    properties: {
      name: item.name,
      labelText: item.name,
      icon: "diamond-marker",
      iconData: diamondIconData,
      iconSize: 1,
      pointColor: "rgba(0,0,0,0)",
      pointSize: 0,
      rendererType: "diamond",
      show: true,
    },
  };
}
