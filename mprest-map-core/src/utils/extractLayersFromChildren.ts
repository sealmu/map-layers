import { Children, isValidElement, type ReactNode } from "react";

/**
 * Extracts layer props from React children (Layer components)
 * @param children - React children containing Layer components
 * @returns Array of layer props extracted from children
 */
export function extractLayersFromChildren<T = unknown>(
  children: ReactNode
): T[] {
  const layerArray: T[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.props) {
      layerArray.push(child.props as T);
    }
  });
  return layerArray;
}

