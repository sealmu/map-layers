import type { LayerProps, LayerData, RendererRegistry, CollectedLayerData, ViewerWithConfigs } from "../types";

/**
 * Collects layer data from the map viewer using provider-agnostic accessors.
 * This function works with any map provider that implements IMapAccessors.
 */
export const collectLayerData = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
  viewer: ViewerWithConfigs<R> | null,
): Record<string, CollectedLayerData> => {
  if (!viewer?.accessors) return {};

  const layerData: Record<string, CollectedLayerData> = {};

  // Get all layers from the map API, excluding base/imagery layers
  const allLayers = layers.filter((layer: LayerProps<LayerData, R>) => {
    // Exclude base map layers and imagery layers
    const excludeIds = ["street-map", "openstreetmap", "base-layer", "imagery"];
    return (
      !excludeIds.includes(layer.id.toLowerCase()) &&
      !layer.id.includes("imagery") &&
      !layer.id.includes("base")
    );
  });

  const accessors = viewer.accessors;

  allLayers.forEach((layer) => {
    // Collect unique renderTypes from actual entities in the viewer
    const types = new Set<string>();
    const entities: Array<{
      id: string;
      name: string;
      layerId: string;
      renderType?: string;
    }> = [];
    let hasDataSource = false;
    let isVisible = true;
    let isActive = false;

    // Use provider-agnostic accessors
    const layerMetadata = accessors.getLayerMetadata(layer.id);
    if (layerMetadata) {
      hasDataSource = true;
      isVisible = layerMetadata.show;
      isActive = true;

      const layerEntities = accessors.getLayerEntities(layer.id);
      layerEntities.forEach((entity) => {
        if (entity.renderType) {
          types.add(entity.renderType);
        }
        entities.push({
          id: entity.id,
          name: entity.name,
          layerId: layer.id,
          renderType: entity.renderType,
        });
      });
    }

    // Also collect types from layer data if available
    if (layer.data && layer.data.length > 0) {
      layer.data.forEach((item) => {
        if (item.renderType) {
          types.add(item.renderType);
        } else if (layer.type && layer.type !== 'custom') {
          types.add(layer.type);
        }
      });
    }

    layerData[layer.id] = {
      hasDataSource,
      isVisible,
      isActive,
      displayName: layer.name,
      entities,
      types,
    };
  });

  return layerData;
};
