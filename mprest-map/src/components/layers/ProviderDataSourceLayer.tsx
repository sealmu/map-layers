import type { DataSourceLayerProps, RendererRegistry } from "../../types";
import { CesiumDataSourceLayer } from "../../providers/cesium/components";

/**
 * Provider-agnostic DataSourceLayer
 *
 * Currently delegates to CesiumDataSourceLayer.
 * When adding new providers, extend this with conditional rendering:
 *
 * @example
 * ```tsx
 * const providerType = viewer?.providerType ?? 'cesium';
 * if (providerType === 'leaflet') {
 *   return <LeafletDataSourceLayer {...props} />;
 * }
 * return <CesiumDataSourceLayer {...props} />;
 * ```
 */
const ProviderDataSourceLayer = <R extends RendererRegistry>(
  props: DataSourceLayerProps<R>,
) => {
  // Currently only Cesium is supported
  // Add provider-specific imports and conditions when adding new providers
  return <CesiumDataSourceLayer {...props} />;
};

export default ProviderDataSourceLayer;
