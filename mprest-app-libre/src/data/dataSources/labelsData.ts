import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const labelsData: LayerData[] = [
  {
    id: "label1",
    positions: [{ longitude: -74.006, latitude: 40.7128 }],
    name: "New York",
    color: Colors.GRAY,
    view: "labels",
  },
  {
    id: "label2",
    positions: [{ longitude: -118.2437, latitude: 34.0522 }],
    name: "Los Angeles",
    color: Colors.GRAY,
    view: "labels",
  },
  {
    id: "label3",
    positions: [{ longitude: -87.6298, latitude: 41.8781 }],
    name: "Chicago",
    color: Colors.GRAY,
    view: "labels",
  },
];
