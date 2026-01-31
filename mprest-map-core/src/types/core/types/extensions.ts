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
// Base Maps API
// ============================================

/**
 * Base map configuration (provider-agnostic)
 */
export interface IBaseMapConfig {
  /** Unique identifier for the base map */
  id: string;
  /** Display name for UI */
  name: string;
  /** Whether this base map is currently enabled/visible on the map */
  isEnabled: boolean;
  /** Whether this base map appears in the layers panel list */
  isListed: boolean;
  /** Optional description */
  description?: string;
  /** Optional thumbnail URL for UI */
  thumbnailUrl?: string;
}

/**
 * Base maps state tracking
 */
export interface IBaseMapState {
  isEnabled: boolean;
  isListed: boolean;
}

/**
 * Base maps panel API (provider-agnostic)
 */
export interface IBaseMapsApi {
  /** All registered base maps */
  baseMaps: IBaseMapConfig[];
  /** Map of base map states by ID */
  baseMapStates: Record<string, IBaseMapState>;
  /** List of currently enabled base maps */
  enabledBaseMaps: IBaseMapConfig[];
  /** Current order of base map IDs (first = back/bottom, last = front/top) */
  baseMapOrder: string[];
  /** Toggle a base map's enabled state */
  toggleBaseMap: (id: string) => void;
  /** Explicitly set a base map's enabled state */
  setBaseMapEnabled: (id: string, enabled: boolean) => void;
  /** Set whether a base map is listed in panels */
  setBaseMapListed: (id: string, listed: boolean) => void;
  /** Enable only a specific base map (radio button behavior) */
  enableOnlyBaseMap: (id: string) => void;
  /** Reorder base maps (first = back/bottom, last = front/top) */
  reorderBaseMaps: (orderedIds: string[]) => void;
  /** Move a base map to a specific index */
  moveBaseMap: (id: string, toIndex: number) => void;
}

// ============================================
// Extension System
// ============================================

/**
 * Extension state union type
 */
export type IExtensionState =
  | ILayersPanelApi
  | IFiltersPanelApi
  | ISearchPanelApi
  | IEntitiesApi
  | IBaseMapsApi;

/**
 * Extension context (flexible record for extension composition)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IExtensionContext = Record<string, any>;

/**
 * Extension module interface
 */
export interface IExtensionModule<T = unknown> {
  name: string;
  useExtension: (ctx: IExtensionContext) => T;
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
  baseMaps?: IBaseMapsApi;
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

/**
 * Base maps card component props
 */
export interface IBaseMapsCardProps {
  api: IBaseMapsApi;
  /** Custom header text (default: "Base Maps") */
  header?: string;
  /** Custom render function for each base map item */
  renderItem?: (
    baseMap: IBaseMapConfig,
    toggleFn: () => void,
    isEnabled: boolean,
  ) => React.ReactNode;
}

/**
 * Base maps panel component props (floating panel with enabled labels)
 */
export interface IBaseMapsPanelProps {
  api: IBaseMapsApi;
  /** Custom render function for each enabled base map label */
  renderLabel?: (baseMap: IBaseMapConfig) => React.ReactNode;
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
