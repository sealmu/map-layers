/**
 * @mprest/map-maplibre
 *
 * MapLibre provider implementation for @mprest/map-core.
 * This package provides MapLibre-specific components, adapters, and renderers.
 */

// Auto-register MapLibre components with the core registry
import "./register";
export { PROVIDER_TYPE } from "./register";

// ============================================
// Components
// ============================================
export { default as MapLibreMap } from "./components/MapLibreMap";
export { default as MapLibreDataSourceLayer } from "./components/MapLibreDataSourceLayer";

// ============================================
// Adapters
// ============================================
export {
  toLngLat,
  toCoordinate,
  toGeoJSONPosition,
  toGeoJSONPositionWithAlt,
  fromGeoJSONPosition,
  toGeoJSONPositions,
  fromGeoJSONPositions,
  toScreenPosition,
  fromScreenPosition,
  toMapLibreColor,
  toHexColor,
  fromRgbaString,
  fromHexColor,
  createColor,
} from "./adapters";

// ============================================
// MapLibre-Specific Renderers
// ============================================
export {
  createPointFeature,
  createPolygonFeature,
  createPolylineFeature,
  createLabelFeature,
  defaultRenderers,
} from "./renderers";

// ============================================
// Core Classes
// ============================================
export { MapLibreMapCamera, createMapLibreMapCamera } from "./MapLibreMapCamera";
export { MapLibreMapAccessors, createMapLibreMapAccessors } from "./MapLibreMapAccessors";
export { MapLibreMapEntity, toMapLibreFeature, updateMapLibreFeature } from "./MapLibreMapEntity";
export { MapLibreDataSource } from "./MapLibreDataSource";
export { MapLibreDataManager, createMapLibreDataManager } from "./MapLibreDataManager";

// ============================================
// Features
// ============================================
export { useFeatures } from "./features/useFeatures";
export { useFeatureChangeEvent } from "./features/useFeatureChangeEvent";

// ============================================
// Types
// ============================================
export type {
  // Events
  EventHandler,

  // Map Click
  MapClickLocation,

  // Feature
  MapLibreFeature,

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
  MapLibreMapProps,
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
