// Provider registry
export {
  registerDataSourceLayer,
  getDataSourceLayer,
  hasDataSourceLayer,
  getRegisteredProviders,
} from "./registry";

// Provider implementations
export * from "./cesium";

// Re-export commonly used items at provider level
export { CesiumMap, CesiumDataSourceLayer } from "./cesium/components";
export { defaultRenderers } from "./cesium/renderers";

// Auto-register Cesium as the default provider
import { registerDataSourceLayer } from "./registry";
import { CesiumDataSourceLayer as CesiumDSL } from "./cesium/components";
registerDataSourceLayer("cesium", CesiumDSL);
