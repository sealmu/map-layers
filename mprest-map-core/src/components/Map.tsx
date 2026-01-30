import type { ReactNode } from "react";
import { getMapComponent, type IMapProps } from "../providers/registry";
import type { IRendererRegistry } from "../types";

/**
 * Provider-agnostic Map component props
 * Note: R is not constrained to allow provider-specific renderer types
 */
export interface MmapProps<R = IRendererRegistry> extends IMapProps<R> {
  /**
   * The map provider to use (e.g., "cesium", "leaflet", "mapbox")
   * @default "cesium"
   */
  provider?: string;
}

/**
 * Provider-agnostic Map component.
 * Uses the provider registry to render the appropriate map implementation.
 * Named "Mmap" to avoid conflict with JavaScript's native Map class.
 *
 * @example
 * ```tsx
 * import { Mmap } from "@mprest/map-core";
 *
 * <Mmap provider="cesium" renderers={renderers}>
 *   <Layer ... />
 * </Mmap>
 * ```
 */
export function Mmap<R = IRendererRegistry>({
  provider = "cesium",
  children,
  ...props
}: MmapProps<R>): ReactNode {
  const MapComponent = getMapComponent<R>(provider);

  if (!MapComponent) {
    throw new Error(
      `Map provider "${provider}" is not registered. ` +
      `Make sure to import the provider package (e.g., @mprest/map-cesium) ` +
      `which auto-registers its components.`
    );
  }

  return <MapComponent {...props}>{children}</MapComponent>;
}

export default Mmap;
