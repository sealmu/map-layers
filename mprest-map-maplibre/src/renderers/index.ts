import type { RendererRegistry } from "../types";
import { createPointFeature } from "./pointRenderer";
import { createPolygonFeature } from "./polygonRenderer";
import { createPolylineFeature } from "./polylineRenderer";
import { createLabelFeature } from "./labelRenderer";

export {
  createPointFeature,
  createPolygonFeature,
  createPolylineFeature,
  createLabelFeature,
};

export const defaultRenderers = {
  points: createPointFeature,
  polygons: createPolygonFeature,
  polylines: createPolylineFeature,
  labels: createLabelFeature,
} as const satisfies RendererRegistry;
