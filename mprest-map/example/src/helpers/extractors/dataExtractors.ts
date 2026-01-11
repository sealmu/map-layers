import type { LayerData } from "@mprest/map";
import { extractByView } from "./byView.extractor";
export {
  extractByPathValue,
  resolveExtractor,
  applyExtractor,
} from "./byPathValue.extractor";

export const extractPoints = (data: LayerData[]): LayerData[] =>
  extractByView(data, "points");

export const extractPolygons = (data: LayerData[]): LayerData[] =>
  extractByView(data, "polygons");

export const extractPolylines = (data: LayerData[]): LayerData[] =>
  extractByView(data, "polylines");

export const extractLabels = (data: LayerData[]): LayerData[] =>
  extractByView(data, "labels");

export const extractDrones = (data: LayerData[]): LayerData[] =>
  extractByView(data, "drones");

export const extractMixed = (data: LayerData[]): LayerData[] =>
  extractByView(data, "mixed");
