/**
 * @mprest/map-core
 *
 * Provider-agnostic core for map applications.
 * This package contains interfaces, types, and utilities that work with any map provider.
 */

// ============================================
// Core Types & Interfaces (Provider-agnostic)
// ============================================
export * from "./types/core";

// ============================================
// Provider Registry
// ============================================
export {
  registerDataSourceLayer,
  getDataSourceLayer,
  hasDataSourceLayer,
  getRegisteredProviders,
  registerMapComponent,
  getMapComponent,
  hasMapComponent,
  providerRegistry,
  getProviderFactory,
  registerProvider,
  type IDataSourceLayerProps,
  type IMapProps,
} from "./providers/registry";

// ============================================
// Provider-Agnostic Renderers
// ============================================
export {
  createPoint,
  createPolygon,
  createPolyline,
  createLabel,
  createEllipse,
  defaultAgnosticRenderers,
  createRenderer,
} from "./renderers";

// ============================================
// Components
// ============================================
export { Mmap, type MmapProps } from "./components/Map";
export { default as Layer } from "./components/layers/Layer";
export { default as DataSourceLayer } from "./components/layers/ProviderDataSourceLayer";

// Panel components
export { default as LayersPanel } from "./components/map/panels/LayersPanel";
export { default as FiltersPanel } from "./components/map/panels/FiltersPanel";
export { default as SearchPanel } from "./components/map/panels/SearchPanel";
export { default as FilterModal } from "./components/map/panels/FilterModal";
export { default as SearchModal } from "./components/map/panels/SearchModal";

// Data connector (provider-agnostic)
export { DataConnector, type DataConnectorProps } from "./components/DataConnector";

// ============================================
// Context & Hooks
// ============================================
export { ViewerProvider } from "./context/providers/ViewerProvider";
export { useViewer } from "./hooks/useViewer";

// ============================================
// Extensions
// ============================================
export { useExtensions } from "./extensions/useExtensions";
export { useExtensionChangeEvent } from "./extensions/useExtensionChangeEvent";

// Core extension hooks (provider-agnostic)
export { useLayers } from "./extensions/core/useLayers";
export { useFilters } from "./extensions/core/useFilters";
export { useSearch } from "./extensions/core/useSearch";
export { useEntities } from "./extensions/core/useEntities";

// Feature factories (for provider-specific configuration)
export {
  default as bookmarksExtension,
  createBookmarksExtension,
  createUseBookmarks,
} from "./extensions/features/useBookmarks";
export type { BookmarksApi, Bookmark, BookmarksConfig } from "./extensions/features/useBookmarks";

export { default as locationsExtension } from "./extensions/features/useLocations";
export type { LocationsApi, Coordinates, GotoOptions, PlaceResult } from "./extensions/features/useLocations";

// ============================================
// Utilities
// ============================================
export { createEventHandler, callAllSubscribers, extractLayersFromChildren, hasLayersChanged, collectLayerData } from "./utils";
export { applyExtractor } from "./helpers/extractors/byPathValue.extractor";
