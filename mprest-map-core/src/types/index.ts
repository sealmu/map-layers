/**
 * Type exports for @mprest/map-core
 *
 * Provider-agnostic types (prefixed with I)
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
// Backward Compatibility Type Aliases
// These map I-prefixed types to non-prefixed versions
// ============================================
export type {
  ILayerData as LayerData,
  ILayerProps as LayerProps,
  IRendererRegistry as RendererRegistry,
} from "./core/types/layer";

export type {
  IFilterData as FilterData,
  ISearchData as SearchData,
  ISearchResult as SearchResult,
  IFeatureExtensionModule as FeatureExtensionModule,
  IFeatureContext as FeatureContext,
  IViewerProviderProps as ViewerProviderProps,
} from "./core/types/features";

export type {
  IViewerWithConfigs as ViewerWithConfigs,
  IViewerContextType as ViewerContextType,
} from "./core/interfaces/IViewerWithConfigs";

export type {
  IEventHandler as EventHandler,
} from "./core/types/events";

export type {
  ILayersPanelApi as LayersPanelApi,
  IFiltersPanelApi as FiltersPanelApi,
  ISearchPanelApi as SearchPanelApi,
  IEntitiesApi as EntitiesApi,
} from "./core/types/features";

export type {
  ICollectedLayerData as CollectedLayerData,
} from "./core/types/layer";
