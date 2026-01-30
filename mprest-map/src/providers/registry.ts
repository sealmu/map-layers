import type { ComponentType } from "react";
import type { DataSourceLayerProps, RendererRegistry } from "../types";

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
 * Get all registered provider types
 */
export function getRegisteredProviders(): string[] {
  return Array.from(dataSourceLayerRegistry.keys());
}
