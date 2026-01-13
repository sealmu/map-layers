import { Entity, PropertyBag } from "cesium";

// Helper function to enrich entity options with metadata properties without replacing existing ones
export function enrichEntity(
  options: Entity.ConstructorOptions,
  rendererType: string,
  layerId?: string,
): void {
  if (!options.properties) {
    options.properties = new PropertyBag({
      rendererType,
      ...(layerId && { layerId }),
    });
  } else {
    if (!options.properties.hasProperty("rendererType")) {
      options.properties.addProperty("rendererType", rendererType);
    }
    if (layerId && !options.properties.hasProperty("layerId")) {
      options.properties.addProperty("layerId", layerId);
    }
  }
}