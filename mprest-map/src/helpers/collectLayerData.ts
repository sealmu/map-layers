import type { LayerConfig } from "../types";
import { Viewer as CesiumViewer } from "cesium";

export interface LayerData {
    hasDataSource: boolean;
    isVisible: boolean;
    displayName: string;
    entities: Array<{
        id: string;
        name: string;
        layerId: string;
        renderType?: string;
    }>;
    types: Set<string>;
}

export const collectLayerData = (
    layers: LayerConfig[],
    viewer: CesiumViewer | null,
): Record<string, LayerData> => {
    if (!viewer) return {};

    const layerData: Record<string, LayerData> = {};

    // Get all layers from the map API, excluding base/imagery layers
    const allLayers = layers.filter((layer: LayerConfig) => {
        // Exclude base map layers and imagery layers
        const excludeIds = [
            "street-map",
            "openstreetmap",
            "base-layer",
            "imagery",
        ];
        return (
            !excludeIds.includes(layer.id.toLowerCase()) &&
            !layer.id.includes("imagery") &&
            !layer.id.includes("base")
        );
    });

    allLayers.forEach((layer) => {
        // Collect unique renderTypes from actual entities in the viewer
        const types = new Set<string>();
        const entities: Array<{ id: string; name: string; layerId: string; renderType?: string }> = [];
        let hasDataSource = false;
        const isVisible = layer.isVisible !== false; // Default to true if not specified

        // Find the data source for this layer and collect entity types
        const dataSources = viewer.dataSources;
        for (let i = 0; i < dataSources.length; i++) {
            const dataSource = dataSources.get(i);
            // Match data source name/id to layer id or name
            const dsName = dataSource.name?.toLowerCase();
            const layerNameId = layer.name?.toLowerCase() || layer.id.toLowerCase();
            if (dsName === layerNameId) {
                hasDataSource = true;
                // Extract entity types from this data source using stored properties
                const ents = dataSource.entities.values;
                ents.forEach((entity) => {
                    // Get rendererType from entity properties
                    const rendererType = entity.properties?.rendererType?.getValue();
                    if (rendererType) {
                        if (rendererType !== layerNameId) types.add(rendererType);
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

        // If no types found, use "custom" as fallback
        if (types.size === 0) {
            types.add(layer.id.toLowerCase());
        }

        layerData[layer.id] = {
            hasDataSource,
            isVisible,
            displayName: layer.name,
            entities,
            types,
        };
    });

    return layerData;
};