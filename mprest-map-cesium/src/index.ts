/**
 * @mprest/map-cesium
 *
 * Cesium provider implementation for @mprest/map-core.
 * This package provides Cesium-specific components, adapters, and renderers.
 */

// Auto-register Cesium components with the core registry
import "./register";
export { PROVIDER_TYPE } from "./register";

// ============================================
// Components
// ============================================
export { default as CesiumMap } from "./components/CesiumMap";
export { default as CesiumDataSourceLayer } from "./components/CesiumDataSourceLayer";
export { DataConnector } from "./components/data/DataConnector";

// ============================================
// Adapters
// ============================================
export {
  toCartesian3,
  toCoordinate,
  toCartesian3Array,
  toCoordinateArray,
  fromCartographic,
  toCartographic,
  toCartesian2,
  toScreenPosition,
  toCesiumColor,
  fromCesiumColor,
  toCesiumColorWithAlpha,
  toCesiumEntityOptions,
  toCesiumEntityUpdates,
} from "./adapters";

// ============================================
// Cesium-Specific Renderers
// ============================================
export {
  createPointEntity,
  createPolygonEntity,
  createPolylineEntity,
  createLabelEntity,
  createDomeEntity,
  defaultRenderers,
} from "./renderers";

// ============================================
// Core Classes
// ============================================
export { CesiumMapCamera } from "./CesiumMapCamera";
export { CesiumMapAccessors } from "./CesiumMapAccessors";
export { CesiumMapEntity } from "./CesiumMapEntity";
export { CesiumDataSource } from "./CesiumDataSource";
export { CesiumDataManager } from "./CesiumDataManager";

// ============================================
// Helpers
// ============================================
export { DataManager } from "./helpers/data/DataManager";
export { createEntityFromData, enrichEntity } from "./helpers/pipeline";

// ============================================
// Hooks
// ============================================
export { useCesiumViewer } from "./hooks/useCesiumViewer";

// ============================================
// Plugins
// ============================================
export { EntitySelectionPlugin } from "./plugins";

// ============================================
// Types
// ============================================
export type {
  // Events
  EventHandler,

  // Map Click
  MapClickLocation,

  // Plugins
  PluginActions,
  PluginEvents,
  PluginClass,

  // Renderers
  EntityRenderer,
  RendererRegistry,
  RenderTypeFromRegistry,
  RenderType,

  // Layer Data
  LayerData,
  LayeredDataWithPayload,
  CollectedLayerData,
  LayerAnimationOptions,
  LayerType,
  LayerConfig,
  ExtractorSpec,
  LayersConfigItem,
  LayerProps,
  LayerDefinition,
  RenderItemFunction,
  AppContentProps,

  // Component Props
  DataSourceLayerProps,
  CesiumMapProps,
  LayersPanelProps,
  FiltersPanelProps,
  SearchPanelProps,

  // Panel APIs
  LayersPanelApi,
  FilterData,
  SearchData,
  SearchResult,
  FiltersPanelApi,
  SearchPanelApi,
  EntitiesApi,
  FeatureState,

  // Feature System
  FeatureContext,
  FeatureExtensionModule,
  ExtendedMapApi,
  MapApi,
  MapInstance,

  // Config Types
  ViewerProviderProps,
  ViewerWithConfigs,
  DataConnectorConfig,
  DataConnectorProps,
  ViewerContextType,
} from "./types";

export { BasePlugin, createRenderTypes } from "./types";

// ============================================
// Re-export core types for convenience
// ============================================
export type {
  ICoordinate,
  IScreenPosition,
  ICameraOrientation,
  ICameraDestination,
  IBoundingBox,
  ICartesian3,
  IColor,
  IPointStyle,
  ILabelStyle,
  IPolylineStyle,
  IPolygonStyle,
  IBillboardStyle,
  IModelStyle,
  IEllipseStyle,
  IMapEntity,
  IEntityOptions,
  IMapProvider,
  IMapProviderOptions,
  IMapProviderEvents,
  IMapClickLocation,
  IDataManager,
  IDataSource,
  IMapCamera,
  IFlyToOptions,
  IMapAccessors,
  IEntityMetadata,
  ILayerMetadata,
  IViewerWithConfigs,
  IViewerContextType,
  IViewerHandlers,
  ILayerConfigAccessor,
  IClickLocation,
  IProviderFactory,
  IProviderRegistry,
  IProviderInstance,
  IProviderOptions,
  IProviderCapabilities,
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
  IEventHandler,
} from "@mprest/map-core";
