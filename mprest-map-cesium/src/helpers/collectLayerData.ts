import type { LayerProps, LayerData, RendererRegistry, CollectedLayerData, ViewerWithConfigs } from "../types";
import type { Viewer as CesiumViewer } from "cesium";

// Accept either a raw Cesium viewer or a ViewerWithConfigs (which may have accessors)
type ViewerLike = CesiumViewer | ViewerWithConfigs;

export const collectLayerData = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
  viewer: ViewerLike | null,
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

  // Check if viewer has provider-agnostic accessors
  const viewerWithConfigs = viewer as ViewerWithConfigs;
  const accessors = viewerWithConfigs.accessors;

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

    // Use provider-agnostic accessors if available
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
      // Fallback to direct Cesium access
      const dataSources = viewer.dataSources;
      for (let i = 0; i < dataSources.length; i++) {
        const dataSource = dataSources.get(i);
        const dsName = dataSource.name?.toLowerCase();
        const layerIdLower = layer.id.toLowerCase();
        const layerNameLower = layer.name?.toLowerCase();
        if (dsName === layerIdLower || dsName === layerNameLower) {
          hasDataSource = true;
          isVisible = dataSource.show;
          isActive = true;
          const ents = dataSource.entities.values;
          ents.forEach((entity) => {
            const rendererType = entity.properties?.rendererType?.getValue();
            if (rendererType) {
              types.add(rendererType);
            }
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
