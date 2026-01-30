import type { ComponentType, ReactNode } from "react";
import type {
  IProviderFactory,
  IProviderRegistry,
  IRendererRegistry,
  ILayerData,
} from "../types";

/**
 * Registry for provider-specific components
 * Allows different map providers to register their implementations
 */

/**
 * Provider-agnostic DataSourceLayer props
 * Note: R is intentionally not constrained to IRendererRegistry to allow
 * provider-specific renderer types (e.g., Cesium renderers with Color, Cartesian3)
 */
export interface IDataSourceLayerProps<R = IRendererRegistry> {
  id: string;
  type: keyof R | "custom";
  data: ILayerData[];
  isActive?: boolean;
  isVisible?: boolean;
  renderers: R;
}

/**
 * Provider-agnostic Map component props
 * Note: R is intentionally not constrained to IRendererRegistry to allow
 * provider-specific renderer types without requiring type casts
 */
export interface IMapProps<R = IRendererRegistry> {
  children: ReactNode;
  renderers: R;
  defaultToken?: string;
  animateActivation?: boolean;
  animateVisibility?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApiChange?: (api: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow provider-specific props
}

type DataSourceLayerComponent<R = IRendererRegistry> =
  ComponentType<IDataSourceLayerProps<R>>;

type MapComponent<R = IRendererRegistry> =
  ComponentType<IMapProps<R>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataSourceLayerRegistry = new Map<string, DataSourceLayerComponent<any>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapComponentRegistry = new Map<string, MapComponent<any>>();

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
export function getDataSourceLayer<R = IRendererRegistry>(
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
// Map Component Registry
// ============================================

/**
 * Register a Map component for a specific provider
 */
export function registerMapComponent(
  providerType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: MapComponent<any>,
): void {
  mapComponentRegistry.set(providerType, component);
}

/**
 * Get the Map component for a specific provider
 */
export function getMapComponent<R = IRendererRegistry>(
  providerType: string,
): MapComponent<R> | undefined {
  return mapComponentRegistry.get(providerType) as MapComponent<R> | undefined;
}

/**
 * Check if a provider has a registered Map component
 */
export function hasMapComponent(providerType: string): boolean {
  return mapComponentRegistry.has(providerType);
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
