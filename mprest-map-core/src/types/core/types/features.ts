import type { ILayerConfig, ICollectedLayerData } from "./layer";

// ============================================
// Layers Panel API
// ============================================

/**
 * Layer state tracking
 */
export interface ILayerState {
  isActive: boolean;
  isVisible: boolean;
  isDocked: boolean;
}

/**
 * Layers panel API (provider-agnostic)
 */
export interface ILayersPanelApi {
  layerStates: Record<string, ILayerState>;
  setLayerStates: React.Dispatch<React.SetStateAction<Record<string, ILayerState>>>;
  toggleLayerActive: (layerId: string) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleActiveAll: () => void;
  toggleVisibleAll: () => void;
  dockedLayers: Set<string>;
  toggleLayerDocked: (layerId: string) => void;
  toggleGroupActive: (group: string) => void;
  toggleGroupVisible: (group: string) => void;
  toggleGroupDocked: (group: string) => void;
  layerConfigs: ILayerConfig[];
}

// ============================================
// Filters Panel API
// ============================================

/**
 * Filter data structure
 */
export type IFilterData = Record<
  string,
  {
    types: Record<string, boolean>;
    layerType?: string;
    hasDataSource?: boolean;
    isVisible?: boolean;
    isActive?: boolean;
    displayName: string;
  }
>;

/**
 * Filters panel API (provider-agnostic)
 */
export interface IFiltersPanelApi {
  filterData: IFilterData;
  isFilterModalOpen: boolean;
  handleFilterChange: (
    layerName: string,
    displayName: string,
    type: string,
    visible: boolean,
  ) => void;
  openFilterModal: () => void;
  closeFilterModal: () => void;
}

// ============================================
// Search Panel API
// ============================================

/**
 * Search data structure
 */
export type ISearchData = Record<
  string,
  ICollectedLayerData & { enabled: boolean; enabledTypesCount: number }
>;

/**
 * Search result
 */
export interface ISearchResult {
  id: string;
  name: string;
  layerId: string;
  renderType?: string;
}

/**
 * Search panel API (provider-agnostic)
 */
export interface ISearchPanelApi {
  searchData: ISearchData;
  searchFilterData: Record<string, { types: Record<string, boolean> }>;
  isSearchModalOpen: boolean;
  searchResults: ISearchResult[];
  searchQuery: string;
  handleLayerToggle: (layerName: string, enabled: boolean) => void;
  handleTypeToggle: (layerId: string, type: string, enabled: boolean) => void;
  performSearch: (query: string) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

// ============================================
// Entities API
// ============================================

/**
 * Entities API (provider-agnostic)
 */
export interface IEntitiesApi {
  findEntity: (entityId: string, layerId?: string) => unknown | null;
  selectEntity: (
    entityId: string,
    layerId?: string,
    flyTo?: boolean | number,
  ) => boolean;
}

// ============================================
// Feature System
// ============================================

/**
 * Feature state union type
 */
export type IFeatureState =
  | ILayersPanelApi
  | IFiltersPanelApi
  | ISearchPanelApi
  | IEntitiesApi;

/**
 * Feature context (flexible record for feature composition)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IFeatureContext = Record<string, any>;

/**
 * Feature extension module interface
 */
export interface IFeatureExtensionModule<T = unknown> {
  name: string;
  useFeature: (ctx: IFeatureContext) => T;
  dependencies?: string[];
  priority?: number;
}

// ============================================
// Map API
// ============================================

/**
 * Core Map API (provider-agnostic)
 */
export interface IMapApi {
  layers: ILayersPanelApi;
  filters: IFiltersPanelApi;
  search: ISearchPanelApi;
  entities: IEntitiesApi;
  [key: string]: unknown;
}

/**
 * Extended Map API with plugin types
 */
export type IExtendedMapApi<
  TPlugins extends Record<string, unknown> = Record<string, never>,
> = IMapApi & TPlugins;

// ============================================
// Panel Props
// ============================================

/**
 * Layers panel component props
 */
export interface ILayersPanelProps {
  api: ILayersPanelApi;
  onFilter?: () => void;
  onSearch?: () => void;
}

/**
 * Filters panel component props
 */
export interface IFiltersPanelProps {
  api: IFiltersPanelApi;
}

/**
 * Search panel component props
 */
export interface ISearchPanelProps {
  api: ISearchPanelApi;
  filters: IFiltersPanelApi;
  entities: IEntitiesApi;
}

// ============================================
// Data Connector
// ============================================

/**
 * Data connector configuration
 */
export interface IDataConnectorConfig {
  fetchInterval?: number;
  fetchIntervals?: Record<string, number>;
}

// ============================================
// Viewer Context
// ============================================

/**
 * Viewer provider props
 */
export interface IViewerProviderProps {
  children: React.ReactNode;
}
