// ============================================
// Core Types & Interfaces (Provider-agnostic)
// ============================================
export * from "./types/core";

// ============================================
// Providers (Cesium, etc.)
// ============================================
// Export specific items to avoid conflicts with legacy exports
export {
  CesiumMap as CesiumMapProvider,
  CesiumDataSourceLayer,
} from "./providers/cesium/components";
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
} from "./providers/cesium/adapters";

// ============================================
// Legacy Exports (Backwards Compatibility)
// ============================================

// CesiumMap - the primary export (from provider)
export { CesiumMap } from "./providers/cesium/components";

// Layer components
export { default as Layer } from "./components/layers/Layer";
export { default as DataSourceLayer } from "./components/layers/ProviderDataSourceLayer";

// Event system
export { createEventHandler } from "./components/map/utils/EventHandler";

// Panel components
export { default as LayersPanel } from "./components/map/panels/LayersPanel";
export { default as FiltersPanel } from "./components/map/panels/FiltersPanel";
export { default as SearchPanel } from "./components/map/panels/SearchPanel";
export { default as FilterModal } from "./components/map/panels/FilterModal";
export { default as SearchModal } from "./components/map/panels/SearchModal";

// Data connector
export { DataConnector } from "./components/data";

// Context & Hooks
export { ViewerProvider } from "./context/providers/ViewerProvider";
export { useViewer } from "./hooks/useViewer";

// Helpers (provider-agnostic)
export { applyExtractor } from "./helpers/extractors/byPathValue.extractor";

// Helpers (Cesium-specific, for backwards compatibility)
export { DataManager } from "./providers/cesium/helpers/data/DataManager";
export { createEntityFromData, enrichEntity } from "./providers/cesium/helpers/pipeline";

// Renderers (Cesium-specific, from provider)
export {
  createPointEntity,
  createPolygonEntity,
  createPolylineEntity,
  createLabelEntity,
  createDomeEntity,
  defaultRenderers,
} from "./providers/cesium/renderers";

// Types (Cesium-specific, kept for backwards compatibility)
// Exclude EntityChangeStatus since it's already exported from core
export {
  type MapClickLocation,
  type EventHandler,
  type PluginActions,
  type PluginEvents,
  BasePlugin,
  type PluginClass,
  type EntityRenderer,
  type RendererRegistry,
  type RenderTypeFromRegistry,
  type RenderType,
  createRenderTypes,
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
  type DataSourceLayerProps,
  type CesiumMapProps,
  type LayersPanelApi,
  type FilterData,
  type SearchData,
  type SearchResult,
  type FiltersPanelApi,
  type SearchPanelApi,
  type EntitiesApi,
  type FeatureState,
  type FeatureContext,
  type FeatureExtensionModule,
  type ExtendedMapApi,
  type MapApi,
  type MapInstance,
  type LayersPanelProps,
  type FiltersPanelProps,
  type SearchPanelProps,
  type DroneAnimationConfig,
  type ViewerProviderProps,
  type ViewerWithConfigs,
  type DataConnectorConfig,
  type DataConnectorProps,
  type ViewerContextType,
} from "./types";

// Plugins (Cesium-specific)
export { EntitySelectionPlugin } from "./providers/cesium/plugins";

// Feature extensions
export type { BookmarksApi, Bookmark } from "./features/extensions/useBookmarks";
export type { LocationsApi, Coordinates, GotoOptions, PlaceResult } from "./features/extensions/useLocations";
