import { Entity } from "cesium";
import type {
  RendererRegistry,
  RenderTypeFromRegistry,
  LayerData,
} from "../../../types";
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

// Main function to create entity from data based on type
export function createEntityFromData<R extends RendererRegistry>(
  type: RenderTypeFromRegistry<R>,
  item: LayerData,
  renderers: R,
): Entity.ConstructorOptions | null {
  const registry = renderers;

  // For custom type, check item-level customRenderer or renderType
  if (type === "custom") {
    // Use item-level custom renderer if provided
    if (item.customRenderer) {
      return item.customRenderer(item);
    }
    // Use item-level renderType if provided
    if (item.renderType) {
      const renderer = registry[item.renderType];
      return renderer ? renderer(item) : null;
    }
    return null;
  }

  // For predefined types, use the registry
  const renderer = registry[type];
  return renderer ? renderer(item) : null;
}
