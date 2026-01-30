import type { LayerProps, LayerData, RendererRegistry } from "../types";

/**
 * Compares two layer arrays to check if they have changed
 * Cesium-specific version that works with Cesium LayerData types
 * @param newLayers - New layer array
 * @param prevLayers - Previous layer array
 * @returns true if layers have changed, false otherwise
 */
export default function hasLayersChanged<R extends RendererRegistry = RendererRegistry>(
    newLayers: LayerProps<LayerData, R>[],
    prevLayers: LayerProps<LayerData, R>[]
): boolean {
    if (newLayers.length !== prevLayers.length) return true;

    return newLayers.some((layer, i) => {
        if (i >= prevLayers.length) return true;
        const prev = prevLayers[i];
        return (
            layer.id !== prev.id ||
            layer.name !== prev.name ||
            layer.type !== prev.type ||
            layer.isDocked !== prev.isDocked
        );
    });
}
