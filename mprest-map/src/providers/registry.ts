import type { ComponentType } from "react";
import type {
  DataSourceLayerProps,
  RendererRegistry,
  IProviderFactory,
  IProviderRegistry,
  IRendererRegistry,
} from "../types";

/**
 * Registry for provider-specific components
 * Allows different map providers to register their implementations
 */

type DataSourceLayerComponent<R extends RendererRegistry = RendererRegistry> =
  ComponentType<DataSourceLayerProps<R>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataSourceLayerRegistry = new Map<string, DataSourceLayerComponent<any>>();

/**
 * Register a DataSourceLayer component for a specific provider
 */
export function registerDataSourceLayer(
  providerType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: DataSourceLayerComponent<any>,
): void {
  dataSourceLayerRegistry.set(providerType, component);
}

/**
 * Get the DataSourceLayer component for a specific provider
 */
export function getDataSourceLayer<R extends RendererRegistry = RendererRegistry>(
  providerType: string,
): DataSourceLayerComponent<R> | undefined {
  return dataSourceLayerRegistry.get(providerType) as DataSourceLayerComponent<R> | undefined;
}

/**
 * Check if a provider has a registered DataSourceLayer
 */
export function hasDataSourceLayer(providerType: string): boolean {
  return dataSourceLayerRegistry.has(providerType);
}

/**
 * Get all registered provider types (from DataSourceLayer registry)
 */
export function getRegisteredProviders(): string[] {
  return Array.from(dataSourceLayerRegistry.keys());
}

// ============================================
// Provider Factory Registry
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providerFactoryRegistry = new Map<string, IProviderFactory<any>>();
let defaultProviderType: string | undefined;

/**
 * Provider registry implementation
 */
export const providerRegistry: IProviderRegistry = {
  register<R extends IRendererRegistry>(factory: IProviderFactory<R>): void {
    providerFactoryRegistry.set(factory.type, factory);
    // Set as default if it's the first registered provider
    if (!defaultProviderType) {
      defaultProviderType = factory.type;
    }
  },

  get<R extends IRendererRegistry>(type: string): IProviderFactory<R> | undefined {
    return providerFactoryRegistry.get(type) as IProviderFactory<R> | undefined;
  },

  has(type: string): boolean {
    return providerFactoryRegistry.has(type);
  },

  getTypes(): string[] {
    return Array.from(providerFactoryRegistry.keys());
  },

  getDefaultType(): string | undefined {
    return defaultProviderType;
  },

  setDefaultType(type: string): void {
    if (!providerFactoryRegistry.has(type)) {
      throw new Error(`Provider type "${type}" is not registered`);
    }
    defaultProviderType = type;
  },
};

/**
 * Get a provider factory by type (convenience function)
 */
export function getProviderFactory<R extends IRendererRegistry = IRendererRegistry>(
  type?: string,
): IProviderFactory<R> | undefined {
  const providerType = type ?? defaultProviderType;
  if (!providerType) {
    return undefined;
  }
  return providerRegistry.get<R>(providerType);
}

/**
 * Register a provider factory (convenience function)
 */
export function registerProvider<R extends IRendererRegistry>(
  factory: IProviderFactory<R>,
): void {
  providerRegistry.register(factory);
}
