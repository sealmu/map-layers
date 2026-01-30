/**
 * Type exports for @mprest/map
 *
 * - Provider-agnostic types: from core/ (prefixed with I)
 * - Cesium-specific types: from providers/cesium/types/ (for backwards compatibility)
 */

// ============================================
// Provider-Agnostic Types (from core/)
// ============================================

// Coordinates & Graphics
export type {
  ICoordinate,
  IScreenPosition,
  ICameraOrientation,
  ICameraDestination,
  IBoundingBox,
  ICartesian3,
} from "./core/types/coordinates";

export type {
  IColor,
  IPointStyle,
  ILabelStyle,
  IPolylineStyle,
  IPolygonStyle,
  IBillboardStyle,
  IModelStyle,
  IEllipseStyle,
} from "./core/types/graphics";

export { Colors } from "./core/types/graphics";

// Interfaces
export type { IMapEntity, IEntityOptions, EntityChangeStatus } from "./core/interfaces/IMapEntity";
export type { IMapProvider, IMapProviderOptions, IMapProviderEvents, IMapClickLocation } from "./core/interfaces/IMapProvider";
export type { IDataManager } from "./core/interfaces/IDataManager";
export type { IDataSource } from "./core/interfaces/IDataSource";
export type { IMapCamera, IFlyToOptions } from "./core/interfaces/IMapCamera";
export type { IMapAccessors, IEntityMetadata, ILayerMetadata } from "./core/interfaces/IMapAccessors";
export type {
  IViewerWithConfigs,
  IViewerContextType,
  IViewerHandlers,
  ILayerConfigAccessor,
  IClickLocation,
} from "./core/interfaces/IViewerWithConfigs";
export type {
  IProviderFactory,
  IProviderRegistry,
  IProviderInstance,
  IProviderOptions,
  IProviderCapabilities,
} from "./core/interfaces/IProviderFactory";

// Layer Types
export type {
  ILayerData,
  ILayerDataWithPayload,
  IEntityRenderer,
  IRendererRegistry,
  IRenderType,
  IRenderTypeFromRegistry,
  ILayerConfig,
  ILayersConfigItem,
  IExtractorSpec,
  ILayerProps,
  ILayerDefinition,
  ICollectedLayerData,
  IRenderItemFunction,
} from "./core/types/layer";

export { createIRenderTypes } from "./core/types/layer";

// Events
export type { IEventHandler } from "./core/types/events";
export { createEventHandler } from "./core/types/events";

// Feature/API Types
export type {
  ILayerState,
  ILayersPanelApi,
  IFilterData,
  IFiltersPanelApi,
  ISearchData,
  ISearchResult,
  ISearchPanelApi,
  IEntitiesApi,
  IFeatureState,
  IFeatureContext,
  IFeatureExtensionModule,
  IMapApi,
  IExtendedMapApi,
  ILayersPanelProps,
  IFiltersPanelProps,
  ISearchPanelProps,
  IDataConnectorConfig,
  IViewerProviderProps,
} from "./core/types/features";

// ============================================
// Cesium-Specific Types (for backwards compatibility)
// ============================================
export {
  // Events (deprecated - use IEventHandler)
  type EventHandler,

  // Map Click
  type MapClickLocation,

  // Plugins
  type PluginActions,
  type PluginEvents,
  BasePlugin,
  type PluginClass,

  // Renderers (Cesium-specific)
  type EntityRenderer,
  type RendererRegistry,
  type RenderTypeFromRegistry,
  type RenderType,
  createRenderTypes,

  // Layer Data (Cesium-specific with Color, Cartesian3)
  type LayerData,
  type LayeredDataWithPayload,
  type CollectedLayerData,
  type LayerAnimationOptions,
  type LayerType,
  type LayerConfig,
  type ExtractorSpec,
  type LayersConfigItem,
  type LayerProps,
  type LayerDefinition,
  type RenderItemFunction,
  type AppContentProps,

  // Component Props
  type DataSourceLayerProps,
  type CesiumMapProps,
  type LayersPanelProps,
  type FiltersPanelProps,
  type SearchPanelProps,

  // Panel APIs (Cesium-specific)
  type LayersPanelApi,
  type FilterData,
  type SearchData,
  type SearchResult,
  type FiltersPanelApi,
  type SearchPanelApi,
  type EntitiesApi,
  type FeatureState,

  // Feature System
  type FeatureContext,
  type FeatureExtensionModule,
  type ExtendedMapApi,
  type MapApi,
  type MapInstance,

  // Config Types
  type ViewerProviderProps,
  type ViewerWithConfigs,
  type DataConnectorConfig,
  type DataConnectorProps,
  type ViewerContextType,
} from "../providers/cesium/types";
