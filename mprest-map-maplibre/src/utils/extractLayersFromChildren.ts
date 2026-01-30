import { Children, isValidElement, type ReactNode } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../types";

/**
 * Extracts layer props from React children (Layer components)
 * MapLibre-specific version that works with MapLibre LayerData types
 * @param children - React children containing Layer components
 * @returns Array of layer props extracted from children
 */
export function extractLayersFromChildren<R extends RendererRegistry = RendererRegistry>(
  children: ReactNode
): LayerProps<LayerData, R>[] {
  const layerArray: LayerProps<LayerData, R>[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.props) {
      layerArray.push(child.props as LayerProps<LayerData, R>);
    }
  });
  return layerArray;
}
