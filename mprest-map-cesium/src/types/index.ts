/**
 * Cesium-specific types.
 *
 * This file contains types that are specific to the Cesium provider.
 * For provider-agnostic types, use types from @mprest/map/types/core.
 *
 * Many types here extend or alias core types, adding Cesium-specific properties.
 */
import type { ReactNode, RefObject } from "react";
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  Entity,
  Viewer as CesiumViewer,
  CustomDataSource,
} from "cesium";
import type { IMapAccessors, IDataManager, EntityChangeStatus, LogEntry } from "@mprest/map-core";

// Re-export core types for convenience (these are provider-agnostic)
export type {
  ILayerConfig,
  ILayerProps,
  ILayerDefinition,
  ICollectedLayerData,
  ILayerData,
  IEntityRenderer,
  IRendererRegistry,
  IRenderType,
  IRenderTypeFromRegistry,
  IEventHandler,
  ILayersPanelApi,
  IFiltersPanelApi,
  ISearchPanelApi,
  IEntitiesApi,
  IFilterData,
  ISearchData,
  ISearchResult,
  IExtensionState,
  IExtensionContext,
  IExtensionModule,
  IMapApi,
  IExtendedMapApi,
  ILayersPanelProps,
  IFiltersPanelProps,
  ISearchPanelProps,
  IDataConnectorConfig,
  IViewerProviderProps,
  EntityChangeStatus,
} from "@mprest/map-core";

// ============================================
// Cesium-Specific Event Handler
// ============================================

/**
 * Event handler interface (Cesium-specific implementation)
 * @deprecated Use IEventHandler from core types
 */
export interface EventHandler<T> {
  subscribe: (callback: T) => () => void;
  unsubscribe: (callback: T) => void;
  subscribers: T[];
}

// ============================================
// Cesium-Specific Click Location
// ============================================

/**
 * Location returned by Cesium map click/selection callbacks.
 * Contains both Cesium-native types and convenience properties.
 */
export interface MapClickLocation {
  /** Cesium Cartesian3 position */
  cartesian: Cartesian3;
  /** Cesium Cartographic position */
  cartographic: Cartographic;
  /** Longitude in degrees */
  longitude: number;
  /** Latitude in degrees */
  latitude: number;
  /** Height in meters */
  height: number;
}

// ============================================
// Cesium Plugin System
// ============================================

export interface PluginActions {
  [key: string]: (...args: unknown[]) => unknown;
}

export interface PluginEvents {
  [key: string]: EventHandler<(...args: unknown[]) => unknown>;
}

export abstract class BasePlugin<
  A extends PluginActions = PluginActions,
  E extends PluginEvents = PluginEvents,
> {
  protected map: MapInstance;
  constructor(map: MapInstance) {
    this.map = map;
  }

  abstract actions: A;
  abstract events: E;
  onClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean | void;
  onClickPrevented?: (
    entity: Entity,
    location: MapClickLocation,
  ) => boolean | void;
  onSelected?: (
    entity: Entity | null,
    location?: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
  onEntityChange?: (
    entity: Entity,
    status: EntityChangeStatus,
    collectionName: string,
  ) => boolean | void;
}

export type PluginClass = new (map: MapInstance) => BasePlugin;

// ============================================
// Cesium Entity Renderer Types
// ============================================

/**
 * Cesium-specific entity renderer that returns Cesium Entity.ConstructorOptions
 */
export type EntityRenderer = (item: LayerData) => Entity.ConstructorOptions;

/**
 * Registry of Cesium entity renderers
 */
export type RendererRegistry = Record<string, EntityRenderer>;

export type RenderTypeFromRegistry<R extends RendererRegistry> =
  | (keyof R & string)
  | "custom";

export type RenderType = RenderTypeFromRegistry<RendererRegistry>;

/**
 * Helper to create render type constants from a renderer registry
 */
export function createRenderTypes<R extends RendererRegistry>(
  renderers: R,
): Record<Uppercase<RenderTypeFromRegistry<R>>, RenderTypeFromRegistry<R>> {
  return {
    ...Object.keys(renderers).reduce(
      (acc, key) => {
        acc[key.toUpperCase() as Uppercase<keyof R & string>] =
          key as RenderTypeFromRegistry<R>;
        return acc;
      },
      {} as Record<Uppercase<keyof R & string>, RenderTypeFromRegistry<R>>,
    ),
    CUSTOM: "custom" as const,
  } as Record<Uppercase<RenderTypeFromRegistry<R>>, RenderTypeFromRegistry<R>>;
}

// ============================================
// Cesium Layer Data Types
// ============================================

/**
 * Layer data with Cesium-native types (Color, Cartesian3).
 * For provider-agnostic version, use ILayerData from core types.
 */
export interface LayerData {
  id: string;
  name: string;
  /** Cesium Color instance */
  color: Color;
  /** Array of Cesium Cartesian3 positions */
  positions: Cartesian3[];
  view: string;
  renderType?: RenderTypeFromRegistry<RendererRegistry>;
  customRenderer?: EntityRenderer;
  data?: unknown;
}

export type LayeredDataWithPayload<TData> = Omit<LayerData, "data"> & {
  data?: TData;
};

/**
 * Collected layer data (Cesium-specific alias)
 * @deprecated Use ICollectedLayerData from core types
 */
export interface CollectedLayerData {
  hasDataSource: boolean;
  isVisible: boolean;
  isActive: boolean;
  displayName: string;
  entities: Array<{
    id: string;
    name: string;
    layerId: string;
    renderType?: string;
  }>;
  types: Set<string>;
}

/**
 * Cesium-specific animation options using CustomDataSource
 */
export type LayerAnimationOptions = {
  dataSourceRef: RefObject<CustomDataSource | null>;
  isActive?: boolean;
  isVisible?: boolean;
  durationMs?: number;
  staggerMs?: number;
  heightOffset?: number;
};

export type LayerType = RenderType;

/**
 * Layer configuration (Cesium-specific alias)
 * @deprecated Use ILayerConfig from core types
 */
export interface LayerConfig {
  id: string;
  name: string;
  isActive: boolean;
  isVisible?: boolean;
  description?: string;
  isDocked?: boolean;
  group?: string;
  groupName?: string;
  groupIsDocked?: boolean;
}

/**
 * Extractor specification for Cesium LayerData
 */
export type ExtractorSpec =
  | ((data: LayerData[]) => LayerData[])
  | { path: string; value: unknown };

export interface LayersConfigItem extends LayerConfig {
  type: RenderTypeFromRegistry<RendererRegistry>;
  extractor: ExtractorSpec;
}

/**
 * Layer props with Cesium LayerData default
 */
export interface LayerProps<
  T = LayerData,
  R extends RendererRegistry = RendererRegistry,
> {
  id: string;
  name: string;
  type: RenderTypeFromRegistry<R>;
  data: T[];
  isActive?: boolean;
  isVisible?: boolean;
  description?: string;
  customRenderer?: EntityRenderer;
  isDocked?: boolean;
  group?: string;
  groupName?: string;
  groupIsDocked?: boolean;
}

export interface LayerDefinition<T = LayerData> {
  config: LayerConfig;
  type: RenderTypeFromRegistry<RendererRegistry>;
  data: T[];
}

export type RenderItemFunction<T = LayerData> = (item: T) => ReactNode;

export interface AppContentProps<
  R extends RendererRegistry = RendererRegistry,
> {
  data: LayerData[];
  renderers: R;
}

// ============================================
// Cesium Component Props
// ============================================

export interface DataSourceLayerProps<
  R extends RendererRegistry = RendererRegistry,
> {
  viewer: ViewerWithConfigs<R>;
  id: string;
  type: RenderTypeFromRegistry<R>;
  data: LayerData[];
  isActive?: boolean;
  isVisible?: boolean;
  customRenderer?: EntityRenderer;
  renderers: R;
  animateActivation?: boolean;
  animateVisibility?: boolean;
  onEntityChange?: (
    entity: Entity,
    status: EntityChangeStatus,
    collectionName: string,
  ) => void;
  onEntityCreating?: (
    options: Entity.ConstructorOptions,
    item: LayerData,
  ) => void;
  onEntityCreate?: (
    type: RenderTypeFromRegistry<R>,
    item: LayerData,
    renderers: R,
    layerId?: string,
  ) => Entity.ConstructorOptions | null;
}

export interface CesiumMapProps<R extends RendererRegistry = RendererRegistry> {
  children: ReactNode;
  defaultToken?: string;
  renderers: R;
  animateActivation?: boolean;
  animateVisibility?: boolean;
  onApiChange?: (api: MapApi) => void;
  onMapReady?: () => void;
  onLog?: (entry: LogEntry) => void;
  onEntityCreating?: (
    options: Entity.ConstructorOptions,
    item: LayerData,
  ) => boolean | void;
  onEntityCreate?: (
    type: RenderTypeFromRegistry<RendererRegistry>,
    item: LayerData,
    renderers: RendererRegistry,
    layerId?: string,
  ) => Entity.ConstructorOptions | null;
  onEntityChange?: (
    entity: Entity,
    status: EntityChangeStatus,
    collectionName: string,
  ) => boolean | void;
  onClick?: (
    entity: Entity | null,
    location: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onSelecting?: (entity: Entity, location: MapClickLocation) => boolean | void;
  onClickPrevented?: (
    entity: Entity,
    location: MapClickLocation,
  ) => boolean | void;
  onSelected?: (
    entity: Entity | null,
    location?: MapClickLocation,
    screenPosition?: Cartesian2,
  ) => boolean | void;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
  onExtensionStateChanged?: (
    name: "layers" | "filters" | "search" | "entities",
    state: ExtensionState,
  ) => void;
  plugins?: Record<string, PluginClass>;
}

// ============================================
// Cesium Panel APIs (extend core interfaces)
// ============================================

/**
 * Cesium-specific layers panel API
 * Extends ILayersPanelApi with Cesium LayerConfig
 */
export interface LayersPanelApi {
  layerStates: Record<
    string,
    { isActive: boolean; isVisible: boolean; isDocked: boolean }
  >;
  setLayerStates: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        { isActive: boolean; isVisible: boolean; isDocked: boolean }
      >
    >
  >;
  toggleLayerActive: (layerId: string) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleActiveAll: () => void;
  toggleVisibleAll: () => void;
  dockedLayers: Set<string>;
  toggleLayerDocked: (layerId: string) => void;
  toggleGroupActive: (group: string) => void;
  toggleGroupVisible: (group: string) => void;
  toggleGroupDocked: (group: string) => void;
  layerConfigs: LayerConfig[];
}

export type FilterData = Record<
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

export type SearchData = Record<
  string,
  CollectedLayerData & { enabled: boolean; enabledTypesCount: number }
>;

export type SearchResult = {
  id: string;
  name: string;
  layerId: string;
  renderType?: string;
};

export interface FiltersPanelApi {
  filterData: Record<
    string,
    {
      types: Record<string, boolean>;
      layerType?: string;
      hasDataSource?: boolean;
      isVisible?: boolean;
      displayName: string;
    }
  >;
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

export interface SearchPanelApi {
  searchData: SearchData;
  searchFilterData: Record<string, { types: Record<string, boolean> }>;
  isSearchModalOpen: boolean;
  searchResults: Array<{
    id: string;
    name: string;
    layerId: string;
    renderType?: string;
  }>;
  searchQuery: string;
  handleLayerToggle: (layerName: string, enabled: boolean) => void;
  handleTypeToggle: (layerId: string, type: string, enabled: boolean) => void;
  performSearch: (query: string) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

/**
 * Cesium-specific entities API with Cesium Entity return type
 */
export type EntitiesApi = {
  findEntity: (entityId: string, layerId?: string) => Entity | null;
  selectEntity: (
    entityId: string,
    layerId?: string,
    flyTo?: boolean | number,
  ) => boolean;
};

export type ExtensionState =
  | LayersPanelApi
  | FiltersPanelApi
  | SearchPanelApi
  | EntitiesApi;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtensionContext = Record<string, any>;

export interface ExtensionModule<T = unknown> {
  name: string;
  useExtension: (ctx: ExtensionContext) => T;
  dependencies?: string[];
  priority?: number;
}

export type ExtendedMapApi<TPlugins extends Record<string, unknown> = Record<string, never>> =
  MapApi & TPlugins;

/**
 * Cesium-specific Map API with Cesium Entity type in entities
 */
export interface MapApi {
  layers: LayersPanelApi;
  filters: FiltersPanelApi;
  search: SearchPanelApi;
  entities: {
    findEntity: (entityId: string, layerId?: string) => Entity | null;
    selectEntity: (
      entityId: string,
      layerId?: string,
      flyTo?: boolean | number,
    ) => boolean;
  };
  [key: string]: unknown;
}

export interface MapInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewer: ViewerWithConfigs<any>;
}

// ============================================
// Cesium Panel Component Props
// ============================================

export interface LayersPanelProps {
  api: LayersPanelApi;
  onFilter?: () => void;
  onSearch?: () => void;
}

export interface FiltersPanelProps {
  api: FiltersPanelApi;
}

export interface SearchPanelProps {
  api: SearchPanelApi;
  filters: FiltersPanelApi;
  entities: {
    findEntity: (entityId: string, layerId?: string) => Entity | null;
    selectEntity: (
      entityId: string,
      layerId?: string,
      flyTo?: boolean | number,
    ) => boolean;
  };
}

export interface ViewerProviderProps {
  children: ReactNode;
}

// ============================================
// Cesium Viewer Extension
// ============================================

/**
 * Extended Cesium Viewer with layer configs, renderers, and API
 * Note: This extends CesiumViewer, so it inherits the native Cesium camera property.
 * For provider-agnostic camera access, use the accessors.
 */
export interface ViewerWithConfigs<
  R extends RendererRegistry = RendererRegistry,
> extends CesiumViewer {
  layersConfig: {
    getLayerConfig: (layerId: string) => LayerProps<LayerData, R> | undefined;
    getAllLayerConfigs: () => LayerProps<LayerData, R>[];
  };
  renderers: {
    getRenderers: () => R;
  };
  api: MapApi;
  handlers: {
    onClick: EventHandler<
      (
        entity: Entity | null,
        location: MapClickLocation,
        screenPosition?: Cartesian2,
      ) => void
    >;
    onSelecting: EventHandler<
      (entity: Entity, location: MapClickLocation) => void
    >;
    onClickPrevented: EventHandler<
      (entity: Entity, location: MapClickLocation) => void
    >;
    onSelected: EventHandler<
      (
        entity: Entity | null,
        location?: MapClickLocation,
        screenPosition?: Cartesian2,
      ) => void
    >;
    onChangePosition: EventHandler<(location: MapClickLocation | null) => void>;
    onEntityChange: EventHandler<
      (
        entity: Entity,
        status: EntityChangeStatus,
        collectionName: string,
      ) => void
    >;
    onApiChange: EventHandler<(api: MapApi) => void>;
    onEntityCreating: EventHandler<
      (options: Entity.ConstructorOptions, item: LayerData) => void
    >;
    onEntityCreate: EventHandler<
      (
        type: RenderTypeFromRegistry<RendererRegistry>,
        item: LayerData,
        renderers: RendererRegistry,
        layerId?: string,
      ) => Entity.ConstructorOptions | null
    >;
    onMapReady: EventHandler<() => void>;
    onLog: EventHandler<(entry: LogEntry) => void>;
  };
  plugins: Record<string, BasePlugin>;
  accessors: IMapAccessors;
  dataManager: IDataManager<LayerData>;
  providerType: "cesium" | "leaflet" | "mapbox" | string;

  /** Access the native Cesium viewer */
  getNativeViewer<T = CesiumViewer>(): T;
}

// ============================================
// Data Connector Types
// ============================================

export type DataConnectorConfig = {
  fetchInterval?: number;
  fetchIntervals?: Record<string, number>;
};

export type DataConnectorProps = {
  dataSource: Record<string, LayerData[]>;
  config: DataConnectorConfig;
};

// ============================================
// Viewer Context
// ============================================

export type ViewerContextType = {
  viewer: ViewerWithConfigs | null;
  setViewer: React.Dispatch<React.SetStateAction<ViewerWithConfigs | null>>;
};

