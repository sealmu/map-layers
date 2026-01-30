import type { LayerProps, LayerData, RendererRegistry } from "../types";

/**
 * Check if layers have changed (shallow comparison)
 */
export function hasLayersChanged<R extends RendererRegistry>(
  newLayers: LayerProps<LayerData, R>[],
  oldLayers: LayerProps<LayerData, R>[]
): boolean {
  if (newLayers.length !== oldLayers.length) return true;

  for (let i = 0; i < newLayers.length; i++) {
    const newLayer = newLayers[i];
    const oldLayer = oldLayers[i];

    if (
      newLayer.id !== oldLayer.id ||
      newLayer.type !== oldLayer.type ||
      newLayer.data !== oldLayer.data ||
      newLayer.isActive !== oldLayer.isActive ||
      newLayer.isVisible !== oldLayer.isVisible
    ) {
      return true;
    }
  }

  return false;
}
