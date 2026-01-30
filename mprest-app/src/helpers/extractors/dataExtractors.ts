import type { LayerData } from "@mprest/map-cesium";
import { extractByView } from "./byView.extractor";
export {
  extractByPathValue,
  resolveExtractor,
  applyExtractor,
} from "./byPathValue.extractor";

export const extractPoints = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "points");
export const extractPolygons = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "polygons");
export const extractPolylines = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "polylines");
export const extractLabels = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "labels");
export const extractDrones = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "drones");
export const extractMixed = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "mixed");
export const extractDomes = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "domes");
export const extractCones = <T extends LayerData>(data: T[]): T[] =>
  extractByView(data, "cones");
