/**
 * Type exports for @mprest/map
 *
 * - Provider-agnostic types: from core/
 * - Cesium-specific types: from providers/cesium/types/ (for backwards compatibility)
 */

// ============================================
// Provider-Agnostic Types (from core/)
// ============================================
export type { ICoordinate, IScreenPosition, ICameraOrientation, IBoundingBox } from "./core/types/coordinates";
export type { IColor } from "./core/types/graphics";
export type { IMapEntity, IEntityOptions } from "./core/interfaces/IMapEntity";
export type { IMapProvider } from "./core/interfaces/IMapProvider";
export type { IDataManager } from "./core/interfaces/IDataManager";
export type { IDataSource } from "./core/interfaces/IDataSource";
export type { IMapCamera } from "./core/interfaces/IMapCamera";
export type { IMapAccessors, IEntityMetadata, ILayerMetadata } from "./core/interfaces/IMapAccessors";
export type { ILayerData, IEntityRenderer } from "./core/types/layer";

// ============================================
// Cesium-Specific Types (for backwards compatibility)
// ============================================
export {
  // Status & Events
  type EntityChangeStatus,
  type EventHandler,

  // Map Click
  type MapClickLocation,

  // Plugins
  type PluginActions,
  type PluginEvents,
  BasePlugin,
  type PluginClass,

  // Renderers
  type EntityRenderer,
  type RendererRegistry,
  type RenderTypeFromRegistry,
  type RenderType,
  createRenderTypes,

  // Layer Data
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

  // Panel APIs
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
