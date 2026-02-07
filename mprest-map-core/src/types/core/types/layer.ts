import type { ReactNode } from "react";
import type { ICoordinate } from "./coordinates";
import type { IColor } from "./graphics";
import type { IEntityOptions } from "../interfaces/IMapEntity";

/**
 * Provider-agnostic layer data interface
 * Replaces the Cesium-specific LayerData
 */
export interface ILayerData {
  id: string;
  name: string;
  color: IColor;
  positions: ICoordinate[];
  view: string;
  renderType?: string;
  customRenderer?: IEntityRenderer;
  data?: unknown;
}

/**
 * Layer data with typed payload
 */
export type ILayerDataWithPayload<TData> = Omit<ILayerData, "data"> & {
  data?: TData;
};

/**
 * Entity renderer function type
 */
export type IEntityRenderer = (item: ILayerData) => IEntityOptions;

/**
 * Renderer registry type
 */
export type IRendererRegistry = Record<string, IEntityRenderer>;

/**
 * Render type from registry
 */
export type IRenderTypeFromRegistry<R extends IRendererRegistry> =
  | (keyof R & string)
  | "custom";

/**
 * Generic render type
 */
export type IRenderType = IRenderTypeFromRegistry<IRendererRegistry>;

/**
 * Helper to create render types from a renderer registry
 */
export function createIRenderTypes<R extends IRendererRegistry>(
  renderers: R,
): Record<Uppercase<keyof R & string> | "CUSTOM", (keyof R & string) | "custom"> {
  return {
    ...Object.keys(renderers).reduce(
      (acc, key) => {
        acc[key.toUpperCase() as Uppercase<keyof R & string>] = key as keyof R & string;
        return acc;
      },
      {} as Record<Uppercase<keyof R & string>, keyof R & string>,
    ),
    CUSTOM: "custom" as const,
  } as Record<Uppercase<keyof R & string> | "CUSTOM", (keyof R & string) | "custom">;
}

// ============================================
// Filter Configuration Types
// ============================================

/**
 * Per-type filter configuration
 */
export interface IFilterTypeConfig {
  isDisplayed?: boolean;
  isEnabled?: boolean;
  isHidden?: boolean;
  initialVisibility?: boolean;
}

/**
 * Filter configuration for a layer
 */
export interface IFilterConfig {
  isDisplayed?: boolean;
  isEnabled?: boolean;
  types?: Record<string, IFilterTypeConfig>;
}

// ============================================
// Clustering Configuration Types
// ============================================

/**
 * Provider-agnostic clustering configuration
 */
export interface IClusteringConfig {
  enabled: boolean;
  pixelRange?: number;
  minimumClusterSize?: number;
}

// ============================================
// Layer Configuration Types
// ============================================

/**
 * Basic layer configuration (provider-agnostic)
 */
export interface ILayerConfig {
  id: string;
  name: string;
  isActive: boolean;
  isVisible?: boolean;
  isDisplayed?: boolean;
  isEnabled?: boolean;
  description?: string;
  isDocked?: boolean;
  group?: string;
  groupName?: string;
  groupIsDocked?: boolean;
  filterConfig?: IFilterConfig;
}

/**
 * Layer configuration with extractor specification
 */
export interface ILayersConfigItem extends ILayerConfig {
  type: IRenderType;
  extractor: IExtractorSpec;
}

/**
 * Extractor specification for filtering layer data
 */
export type IExtractorSpec =
  | ((data: ILayerData[]) => ILayerData[])
  | { path: string; value: unknown };

/**
 * Layer component props (provider-agnostic)
 */
export interface ILayerProps<
  T = ILayerData,
  R extends IRendererRegistry = IRendererRegistry,
> {
  id: string;
  name: string;
  type: IRenderTypeFromRegistry<R>;
  data: T[];
  isActive?: boolean;
  isVisible?: boolean;
  isDisplayed?: boolean;
  isEnabled?: boolean;
  description?: string;
  customRenderer?: IEntityRenderer;
  onEntityCreating?: (options: IEntityOptions, item: ILayerData) => boolean | void;
  isDocked?: boolean;
  group?: string;
  groupName?: string;
  groupIsDocked?: boolean;
  filterConfig?: IFilterConfig;
  clusteringConfig?: IClusteringConfig;
}

/**
 * Layer definition combining config and data
 */
export interface ILayerDefinition<T = ILayerData> {
  config: ILayerConfig;
  type: IRenderType;
  data: T[];
}

/**
 * Collected layer data with metadata
 */
export interface ICollectedLayerData {
  hasDataSource: boolean;
  isVisible: boolean;
  isActive: boolean;
  displayName: string;
  entities: Array<{
    id: string;
    name: string;
    layerId: string;
    renderType?: string;
  }>;
  types: Set<string>;
}

/**
 * Function to render an item
 */
export type IRenderItemFunction<T = ILayerData> = (item: T) => ReactNode;
