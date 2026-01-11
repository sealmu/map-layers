import type { ReactNode } from "react";
import { Cartesian3, Color, Entity, Viewer as CesiumViewer } from "cesium";

// Type for entity renderer functions
export type EntityRenderer = (item: LayerData) => Entity.ConstructorOptions;

export type RendererRegistry = Record<string, EntityRenderer>;
export type RenderTypeFromRegistry<R extends RendererRegistry> =
  | (keyof R & string)
  | "custom";
export type RenderType = RenderTypeFromRegistry<RendererRegistry>;

export function createRenderTypes<R extends RendererRegistry>(
  renderers: R,
): Record<Uppercase<RenderTypeFromRegistry<R>>, RenderTypeFromRegistry<R>> {
  return {
    ...Object.keys(renderers).reduce((acc, key) => {
      acc[key.toUpperCase() as Uppercase<keyof R & string>] =
        key as RenderTypeFromRegistry<R>;
      return acc;
    }, {} as Record<Uppercase<keyof R & string>, RenderTypeFromRegistry<R>>),
    CUSTOM: "custom" as const,
  } as Record<Uppercase<RenderTypeFromRegistry<R>>, RenderTypeFromRegistry<R>>;
}

// Unified interface for all layer data types
export interface LayerData {
  id: string;
  name: string;
  color: Color;
  positions: Cartesian3[]; // Array for all types: [single point] or [multiple points]
  view: string;
  renderType?: RenderTypeFromRegistry<RendererRegistry>; // Optional render type at item level (for custom layers without layer-level renderer)
  customRenderer?: EntityRenderer; // Optional custom renderer at item level
  data?: unknown; // Optional additional data
}

// App-specific helper to supply a stricter shape for the optional data field
export type LayeredDataWithPayload<TData> = Omit<LayerData, "data"> & {
  data?: TData;
};

// Convenience type for data objects carrying raw coordinates and a shape marker
// RenderType is derived from provided renderer keys; keep a string alias for typing
export type LayerType = RenderType;

export interface LayerConfig {
  id: string;
  name: string;
  isActive: boolean;
  isVisible?: boolean;
  description?: string;
  isDocked?: boolean;
}

export type ExtractorSpec =
  | ((data: LayerData[]) => LayerData[])
  | { path: string; value: unknown };

export interface LayersConfigItem extends LayerConfig {
  type: RenderTypeFromRegistry<RendererRegistry>;
  extractor: ExtractorSpec;
}

export interface LayerProps<
  T = LayerData,
  R extends RendererRegistry = RendererRegistry,
> {
  id: string;
  name: string;
  type: RenderTypeFromRegistry<R>;
  data: T[];
  isActive?: boolean;
  isVisible?: boolean;
  description?: string;
  customRenderer?: EntityRenderer;
  isDocked?: boolean;
}

export interface LayerDefinition<T = LayerData> {
  config: LayerConfig;
  type: RenderTypeFromRegistry<RendererRegistry>;
  data: T[];
}

export type RenderItemFunction<T = LayerData> = (item: T) => ReactNode;

// App Component
export interface AppContentProps<
  R extends RendererRegistry = RendererRegistry,
> {
  data: LayerData[];
  renderers: R;
}

// DataSourceLayer Component
export interface DataSourceLayerProps<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: CesiumViewer;
  id: string;
  name: string;
  type: RenderTypeFromRegistry<R>;
  data: LayerData[];
  isActive?: boolean;
  isVisible?: boolean;
  customRenderer?: EntityRenderer;
  renderers: R;
  animateActivation?: boolean;
  animateVisibility?: boolean;
}

// CesiumMap Component
export interface CesiumMapProps<R extends RendererRegistry = RendererRegistry> {
  children: ReactNode;
  defaultToken?: string;
  renderers: R;
  animateActivation?: boolean;
  animateVisibility?: boolean;
  onApiReady?: (api: CesiumMapApi) => void;
}

export interface LayersPanelApi {
  layerStates: Record<
    string,
    { isActive: boolean; isVisible: boolean; isDocked: boolean }
  >;
  setLayerStates: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        { isActive: boolean; isVisible: boolean; isDocked: boolean }
      >
    >
  >;
  toggleLayerActive: (layerId: string) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleActiveAll: () => void;
  toggleVisibleAll: () => void;
  dockedLayers: Set<string>;
  toggleLayerDocked: (layerId: string) => void;
  layers: LayerConfig[];
}

export interface CesiumMapApi {
  api: {
    layersPanel: LayersPanelApi;
  };
}

export interface LayersPanelProps {
  api: LayersPanelApi;
}

// DroneAnimation Hook
export interface DroneAnimationConfig {
  droneId: string;
  centerLon: number;
  centerLat: number;
  radius: number;
  baseAlt: number;
  altAmp: number;
  segments: number;
  orbitDurationMs: number;
}

// ViewerContext
export interface ViewerContextType {
  viewer: CesiumViewer | null;
  setViewer: (viewer: CesiumViewer | null) => void;
}

// ViewerProvider
export interface ViewerProviderProps {
  children: ReactNode;
}

// Enhanced Viewer with layers and renderers properties
export interface ViewerWithConfigs extends CesiumViewer {
  layers: {
    getLayerConfig: (
      layerId: string,
    ) => LayerProps<LayerData, RendererRegistry> | undefined;
    getAllLayerConfigs: () => LayerProps<LayerData, RendererRegistry>[];
  };
  renderers: {
    getRenderers: () => RendererRegistry;
  };
}

// DataConnector
export type DataConnectorConfig = {
  fetchInterval?: number;
  fetchIntervals?: Record<string, number>;
};

export type DataConnectorProps = {
  dataSource: Record<string, LayerData[]>;
  config: DataConnectorConfig;
};
