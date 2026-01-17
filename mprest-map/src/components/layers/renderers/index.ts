import type { RendererRegistry } from "../../../types";
import { createPointEntity } from "./pointRenderer";
import { createPolygonEntity } from "./polygonRenderer";
import { createPolylineEntity } from "./polylineRenderer";
import { createLabelEntity } from "./labelRenderer";
import { createDomeEntity } from "./domeRenderer";

export {
  createPointEntity,
  createPolygonEntity,
  createPolylineEntity,
  createLabelEntity,
  createDomeEntity,
};

export const defaultRenderers = {
  points: createPointEntity,
  polygons: createPolygonEntity,
  polylines: createPolylineEntity,
  labels: createLabelEntity,
  domes: createDomeEntity,
} as const satisfies RendererRegistry;
