import { Entity, PropertyBag } from "cesium";
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

// Helper function to enrich entity options with metadata properties without replacing existing ones
export function enrichEntity(
  options: Entity.ConstructorOptions,
  rendererType: string,
  layerId?: string,
): void {
  if (!options.properties) {
    options.properties = new PropertyBag({
      rendererType,
      ...(layerId && { layerId })
    });
  } else {
    if (!options.properties.hasProperty('rendererType')) {
      options.properties.addProperty('rendererType', rendererType);
    }
    if (layerId && !options.properties.hasProperty('layerId')) {
      options.properties.addProperty('layerId', layerId);
    }
  }
}

// Main function to create entity from data based on type
export function createEntityFromData<R extends RendererRegistry>(
  type: RenderTypeFromRegistry<R>,
  item: LayerData,
  renderers: R,
  layerId?: string,
): Entity.ConstructorOptions | null {
  const registry = renderers;

  // For custom type, check item-level customRenderer or renderType
  if (type === "custom") {
    // Use item-level custom renderer if provided
    if (item.customRenderer) {
      const options = item.customRenderer(item);
      if (options) {
        enrichEntity(options, "custom", layerId);
        return options;
      }
    }
    // Use item-level renderType if provided
    if (item.renderType) {
      const renderer = registry[item.renderType];
      const options = renderer ? renderer(item) : null;
      if (options) {
        enrichEntity(options, item.renderType, layerId);
        return options;
      }
    }
    return null;
  }

  // For predefined types, use the registry
  const renderer = registry[type];
  const options = renderer ? renderer(item) : null;
  if (options) {
    enrichEntity(options, type, layerId);
    return options;
  }
  return null;
}
