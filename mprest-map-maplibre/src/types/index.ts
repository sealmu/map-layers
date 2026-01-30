/**
 * MapLibre-specific types.
 *
 * This file contains types that are specific to the MapLibre provider.
 * For provider-agnostic types, use types from @mprest/map-core.
 */
import type { ReactNode, RefObject } from "react";
import type { Map as MapLibreMap, LngLat, GeoJSONSource } from "maplibre-gl";
import type { IMapAccessors, EntityChangeStatus, IColor } from "@mprest/map-core";
import type { Feature, Point, Polygon, LineString, GeoJsonProperties } from "geojson";

// Re-export core types for convenience
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
  EntityChangeStatus,
} from "@mprest/map-core";

// ============================================
// MapLibre-Specific Event Handler
// ============================================

export interface EventHandler<T> {
  subscribe: (callback: T) => () => void;
  unsubscribe: (callback: T) => void;
  subscribers: T[];
}

// ============================================
// MapLibre-Specific Click Location
// ============================================

export interface MapClickLocation {
  lngLat: LngLat;
  longitude: number;
  latitude: number;
  point: { x: number; y: number };
}

// ============================================
// MapLibre Plugin System
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
    feature: MapLibreFeature | null,
    location: MapClickLocation,
  ) => boolean | void;
  onSelected?: (
    feature: MapLibreFeature | null,
    location?: MapClickLocation,
  ) => boolean | void;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
  onEntityChange?: (
    feature: MapLibreFeature,
    status: EntityChangeStatus,
    layerId: string,
  ) => boolean | void;
}

export type PluginClass = new (map: MapInstance) => BasePlugin;

// ============================================
// MapLibre Entity/Feature Types
// ============================================

export type MapLibreFeature = Feature<Point | Polygon | LineString, GeoJsonProperties> & {
  id: string;
  layerId?: string;
  renderType?: string;
};

// ============================================
// MapLibre Entity Renderer Types
// ============================================

export type EntityRenderer = (item: LayerData) => MapLibreFeature;

export type RendererRegistry = Record<string, EntityRenderer>;

export type RenderTypeFromRegistry<R extends RendererRegistry> =
  | (keyof R & string)
  | "custom";

export type RenderType = RenderTypeFromRegistry<RendererRegistry>;

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
// MapLibre Layer Data Types
// ============================================

export interface LayerData {
  id: string;
  name: string;
  color: IColor;
  positions: Array<{ longitude: number; latitude: number; height?: number }>;
  view: string;
  renderType?: RenderTypeFromRegistry<RendererRegistry>;
  customRenderer?: EntityRenderer;
  /** Item-level custom renderer (used within mixed layers to avoid collision with layer-level customRenderer) */
  itemRenderer?: EntityRenderer;
  data?: unknown;
}

export type LayeredDataWithPayload<TData> = Omit<LayerData, "data"> & {
  data?: TData;
};

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

export type LayerAnimationOptions = {
  sourceRef: RefObject<GeoJSONSource | null>;
  isActive?: boolean;
  isVisible?: boolean;
  durationMs?: number;
};

export type LayerType = RenderType;

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

export type ExtractorSpec =
  | ((data: LayerData[]) => LayerData[])
  | { path: string; value: unknown };

export interface LayersConfigItem extends LayerConfig {
  type: RenderTypeFromRegistry<RendererRegistry>;
  extractor: ExtractorSpec;
}

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
// MapLibre Component Props
// ============================================

export interface DataSourceLayerProps<
  R extends RendererRegistry = RendererRegistry,
> {
  map: ViewerWithConfigs<R>;
  id: string;
  type: RenderTypeFromRegistry<R>;
  data: LayerData[];
  isActive?: boolean;
  isVisible?: boolean;
  customRenderer?: EntityRenderer;
  renderers: R;
  onEntityChange?: (
    feature: MapLibreFeature,
    status: EntityChangeStatus,
    layerId: string,
  ) => void;
  onEntityCreating?: (
    feature: MapLibreFeature,
    item: LayerData,
  ) => void;
  onEntityCreate?: (
    type: RenderTypeFromRegistry<R>,
    item: LayerData,
    renderers: R,
    layerId?: string,
  ) => MapLibreFeature | null;
}

export interface MapLibreMapProps<R extends RendererRegistry = RendererRegistry> {
  children: ReactNode;
  renderers: R;
  style?: string;
  center?: [number, number];
  zoom?: number;
  onApiChange?: (api: MapApi) => void;
  onEntityCreating?: (
    feature: MapLibreFeature,
    item: LayerData,
  ) => boolean | void;
  onEntityCreate?: (
    type: RenderTypeFromRegistry<RendererRegistry>,
    item: LayerData,
    renderers: RendererRegistry,
    layerId?: string,
  ) => MapLibreFeature | null;
  onEntityChange?: (
    feature: MapLibreFeature,
    status: EntityChangeStatus,
    layerId: string,
  ) => boolean | void;
  onClick?: (
    feature: MapLibreFeature | null,
    location: MapClickLocation,
  ) => boolean | void;
  onSelecting?: (
    feature: MapLibreFeature,
    location: MapClickLocation,
  ) => boolean | void;
  onClickPrevented?: (
    feature: MapLibreFeature,
    location: MapClickLocation,
  ) => boolean | void;
  onSelected?: (
    feature: MapLibreFeature | null,
    location?: MapClickLocation,
  ) => boolean | void;
  onChangePosition?: (location: MapClickLocation | null) => boolean | void;
  onFeatureStateChanged?: (
    name: "layers" | "filters" | "search" | "entities",
    state: FeatureState,
  ) => void;
  plugins?: Record<string, PluginClass>;
}

// ============================================
// MapLibre Panel APIs
// ============================================

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

export type EntitiesApi = {
  findEntity: (entityId: string, layerId?: string) => MapLibreFeature | null;
  selectEntity: (
    entityId: string,
    layerId?: string,
    flyTo?: boolean | number,
  ) => boolean;
};

export type FeatureState =
  | LayersPanelApi
  | FiltersPanelApi
  | SearchPanelApi
  | EntitiesApi;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeatureContext = Record<string, any>;

export interface FeatureExtensionModule<T = unknown> {
  name: string;
  useFeature: (ctx: FeatureContext) => T;
  dependencies?: string[];
  priority?: number;
}

export type ExtendedMapApi<TPlugins extends Record<string, unknown> = Record<string, never>> =
  MapApi & TPlugins;

export interface MapApi {
  layers: LayersPanelApi;
  filters: FiltersPanelApi;
  search: SearchPanelApi;
  entities: {
    findEntity: (entityId: string, layerId?: string) => MapLibreFeature | null;
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
// MapLibre Panel Component Props
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
    findEntity: (entityId: string, layerId?: string) => MapLibreFeature | null;
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
// MapLibre Viewer Extension (map instance with configs)
// ============================================

export interface ViewerWithConfigs<
  R extends RendererRegistry = RendererRegistry,
> {
  /** Native MapLibre map instance */
  map: MapLibreMap;

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
        feature: MapLibreFeature | null,
        location: MapClickLocation,
      ) => void
    >;
    onSelecting: EventHandler<
      (
        feature: MapLibreFeature,
        location: MapClickLocation,
      ) => boolean | void
    >;
    onClickPrevented: EventHandler<
      (
        feature: MapLibreFeature,
        location: MapClickLocation,
      ) => void
    >;
    onSelected: EventHandler<
      (
        feature: MapLibreFeature | null,
        location?: MapClickLocation,
      ) => void
    >;
    onChangePosition: EventHandler<(location: MapClickLocation | null) => void>;
    onEntityChange: EventHandler<
      (
        feature: MapLibreFeature,
        status: EntityChangeStatus,
        layerId: string,
      ) => void
    >;
    onApiChange: EventHandler<(api: MapApi) => void>;
    onEntityCreating: EventHandler<
      (feature: MapLibreFeature, item: LayerData) => void
    >;
    onEntityCreate: EventHandler<
      (
        type: RenderTypeFromRegistry<RendererRegistry>,
        item: LayerData,
        renderers: RendererRegistry,
        layerId?: string,
      ) => MapLibreFeature | null
    >;
  };
  plugins: Record<string, BasePlugin>;
  accessors: IMapAccessors;
  providerType: "maplibre" | string;

  /** Feature store - maps featureId to feature data by layer */
  featureStore: Map<string, Map<string, MapLibreFeature>>;

  getNativeMap(): MapLibreMap;
  isDestroyed(): boolean;
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
