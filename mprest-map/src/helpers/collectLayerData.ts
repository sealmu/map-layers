import type { LayerProps, LayerData, RendererRegistry, CollectedLayerData } from "@mprest/map";
import { Viewer as CesiumViewer } from "cesium";

export const collectLayerData = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
  viewer: CesiumViewer | null,
): Record<string, CollectedLayerData> => {
  if (!viewer) return {};

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

    // Find the data source for this layer and collect entity types
    // Read actual runtime state from Cesium (source of truth)
    const dataSources = viewer.dataSources;
    for (let i = 0; i < dataSources.length; i++) {
      const dataSource = dataSources.get(i);
      // Match data source name/id to layer id or name
      const dsName = dataSource.name?.toLowerCase();
      const layerIdLower = layer.id.toLowerCase();
      const layerNameLower = layer.name?.toLowerCase();
      if (dsName === layerIdLower || dsName === layerNameLower) {
        hasDataSource = true;
        // Read visibility from actual dataSource state
        isVisible = dataSource.show;
        // If dataSource is in viewer.dataSources, it's active
        isActive = true;
        // Extract entity types from this data source using stored properties
        const ents = dataSource.entities.values;
        ents.forEach((entity) => {
          // Get rendererType from entity properties
          const rendererType = entity.properties?.rendererType?.getValue();
          if (rendererType) {
            types.add(rendererType);
          }
          // Collect entity for search
          entities.push({
            id: entity.id,
            name: entity.name || entity.id,
            layerId: layer.id,
            renderType: rendererType,
          });
        });
        break;
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

    // No fallback

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
