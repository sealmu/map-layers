/**
 * Provider Registry for @mprest/map-core
 *
 * Allows different map providers to register their implementations
 */

export {
  registerDataSourceLayer,
  getDataSourceLayer,
  hasDataSourceLayer,
  getRegisteredProviders,
  providerRegistry,
  getProviderFactory,
  registerProvider,
} from "./registry";
