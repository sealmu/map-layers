import type { LayerProps, LayerData, RendererRegistry, CollectedLayerData, ViewerWithConfigs } from "../types";

export const collectLayerData = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
  viewer: ViewerWithConfigs | null,
): Record<string, CollectedLayerData> => {
  if (!viewer) return {};

  const layerData: Record<string, CollectedLayerData> = {};

  // Get all layers from the map API, excluding base/imagery layers
  const allLayers = layers.filter((layer: LayerProps<LayerData, R>) => {
    // Exclude base map layers
    const excludeIds = ["street-map", "openstreetmap", "base-layer"];
    return (
      !excludeIds.includes(layer.id.toLowerCase()) &&
      !layer.id.includes("base")
    );
  });

  const accessors = viewer.accessors;

  allLayers.forEach((layer) => {
    // Collect unique renderTypes from actual entities
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
    if (accessors) {
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
    } else {
      // Fallback to feature store
      const layerFeatures = viewer.featureStore.get(layer.id);
      if (layerFeatures && layerFeatures.size > 0) {
        hasDataSource = true;
        isActive = true;

        for (const feature of layerFeatures.values()) {
          const rendererType = feature.renderType;
          if (rendererType) {
            types.add(rendererType);
          }
          entities.push({
            id: feature.id,
            name: (feature.properties?.name as string) || feature.id,
            layerId: layer.id,
            renderType: rendererType,
          });
        }
      }
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
