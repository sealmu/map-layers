import type { RendererRegistry } from "../../../types";
import { createPointEntity } from "./pointRenderer";
import { createPolygonEntity } from "./polygonRenderer";
import { createPolylineEntity } from "./polylineRenderer";
import { createLabelEntity } from "./labelRenderer";

export {
  createPointEntity,
  createPolygonEntity,
  createPolylineEntity,
  createLabelEntity,
};

export const defaultRenderers = {
  points: createPointEntity,
  polygons: createPolygonEntity,
  polylines: createPolylineEntity,
  labels: createLabelEntity,
} as const satisfies RendererRegistry;
