import type { ILayerProps, ILayerData, IRendererRegistry, ICollectedLayerData, IViewerWithConfigs } from "../types";

/**
 * Collects layer data from the map viewer using provider-agnostic accessors.
 * This function works with any map provider that implements IMapAccessors.
 */
export const collectLayerData = <R extends IRendererRegistry>(
  layers: ILayerProps<ILayerData, R>[],
  viewer: IViewerWithConfigs<R> | null,
): Record<string, ICollectedLayerData> => {
  if (!viewer?.accessors) return {};

  const layerData: Record<string, ICollectedLayerData> = {};

  // Get all layers from the map API, excluding base/imagery layers
  const allLayers = layers.filter((layer: ILayerProps<ILayerData, R>) => {
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
          types.add(layer.type as string);
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
