import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const polylinesData: LayerData[] = [
  {
    id: "polyline1",
    positions: [
      { longitude: -122.4194, latitude: 37.7749 }, // San Francisco
      { longitude: -118.2437, latitude: 34.0522 }, // Los Angeles
      { longitude: -117.1611, latitude: 32.7157 }, // San Diego
    ],
    name: "California Coast",
    color: Colors.fromRgb(0, 102, 204), // Blue
    view: "polylines",
  },
  {
    id: "polyline2",
    positions: [
      { longitude: -74.006, latitude: 40.7128 }, // New York
      { longitude: -75.1652, latitude: 39.9526 }, // Philadelphia
      { longitude: -77.0369, latitude: 38.9072 }, // Washington DC
    ],
    name: "East Coast Route",
    color: Colors.fromRgb(204, 102, 0), // Orange
    view: "polylines",
  },
];
