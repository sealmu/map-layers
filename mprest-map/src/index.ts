// ============================================
// Core Types & Interfaces (Provider-agnostic)
// ============================================
export * from "./core";

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

// CesiumMap - the primary export
export { default as CesiumMap } from "./components/map/CesiumMap";

// Layer component
export { default as Layer } from "./components/layers/Layer";

// Event system
export { createEventHandler } from "./components/map/utils/EventHandler";

// Panel components
export { default as LayersPanel } from "./components/map/panels/LayersPanel";
export { default as FiltersPanel } from "./components/map/panels/FiltersPanel";
export { default as SearchPanel } from "./components/map/panels/SearchPanel";
export { default as FilterModal } from "./components/map/panels/FilterModal";
export { default as SearchModal } from "./components/map/panels/SearchModal";

// Data connector
export { DataConnector } from "./components/map/DataConnector";

// Context & Hooks
export { ViewerProvider } from "./context/providers/ViewerProvider";
export { useViewer } from "./hooks/useViewer";

// Helpers
export { applyExtractor } from "./helpers/extractors/byPathValue.extractor";
export { DataManager } from "./helpers/data/DataManager";
export { createEntityFromData, enrichEntity } from "./helpers/pipeline";

// Renderers (from legacy location)
export {
  createPointEntity,
  createPolygonEntity,
  createPolylineEntity,
  createLabelEntity,
  createDomeEntity,
  defaultRenderers,
} from "./components/layers/renderers";

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

// Plugins
export { EntitySelectionPlugin } from "./plugins/EntitySelectionPlugin";

// Feature extensions
export type { BookmarksApi, Bookmark } from "./features/extensions/useBookmarks";
export type { LocationsApi, Coordinates, GotoOptions, PlaceResult } from "./features/extensions/useLocations";
