import type { IRendererRegistry } from "../../types";
import { getDataSourceLayer, type IDataSourceLayerProps } from "../../providers/registry";

/**
 * Provider-agnostic DataSourceLayer
 *
 * Uses the provider registry to render the appropriate DataSourceLayer
 * component based on the current provider type.
 *
 * Providers must register their DataSourceLayer component using:
 * ```ts
 * registerDataSourceLayer('cesium', CesiumDataSourceLayer);
 * ```
 */
const ProviderDataSourceLayer = <R extends IRendererRegistry>(
  props: IDataSourceLayerProps<R> & { providerType?: string },
) => {
  const { providerType = "cesium", ...rest } = props;

  const DataSourceLayerComponent = getDataSourceLayer<R>(providerType);

  if (!DataSourceLayerComponent) {
    console.warn(
      `No DataSourceLayer component registered for provider type "${providerType}". ` +
        `Register one using registerDataSourceLayer().`
    );
    return null;
  }

  return <DataSourceLayerComponent {...rest} />;
};

export default ProviderDataSourceLayer;
