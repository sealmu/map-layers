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

// Location returned by map click/selection callbacks
export interface MapClickLocation {
  cartesian: Cartesian3;
  cartographic: Cartographic;
  longitude: number;
  latitude: number;
  height: number;
}

// Entity change status type
export type EntityChangeStatus = "added" | "removed" | "changed";

// Event handler interface for subscribing to map events
export interface EventHandler<T> {
  subscribe: (callback: T) => () => void; // returns unsubscribe function
  unsubscribe: (callback: T) => void;
  subscribers: T[];
}

// Plugin types
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
  // Optional handler methods
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

// Type for entity renderer functions
export type EntityRenderer = (item: LayerData) => Entity.ConstructorOptions;

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

// Unified interface for all layer data types
export interface LayerData {
  id: string;
  name: string;
  color: Color;
  positions: Cartesian3[]; // Array for all types: [single point] or [multiple points]
  view: string;
  renderType?: RenderTypeFromRegistry<RendererRegistry>; // Optional render type at item level (for custom layers without layer-level renderer)
  customRenderer?: EntityRenderer; // Optional custom renderer at item level
  data?: unknown; // Optional additional data
}

// App-specific helper to supply a stricter shape for the optional data field
export type LayeredDataWithPayload<TData> = Omit<LayerData, "data"> & {
  data?: TData;
};

// Collected layer data from collectLayerData function
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
  dataSourceRef: RefObject<CustomDataSource | null>;
  isActive?: boolean;
  isVisible?: boolean;
  durationMs?: number;
  staggerMs?: number;
  heightOffset?: number;
};

// Convenience type for data objects carrying raw coordinates and a shape marker
// RenderType is derived from provided renderer keys; keep a string alias for typing
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

// App Component
export interface AppContentProps<
  R extends RendererRegistry = RendererRegistry,
> {
  data: LayerData[];
  renderers: R;
}

// DataSourceLayer Component
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

// CesiumMap Component
export interface CesiumMapProps<R extends RendererRegistry = RendererRegistry> {
  children: ReactNode;
  defaultToken?: string;
  renderers: R;
  animateActivation?: boolean;
  animateVisibility?: boolean;
  onApiChange?: (api: MapApi) => void;
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
  onFeatureStateChanged?: (
    name: "layers" | "filters" | "search" | "entities",
    state: FeatureState,
  ) => void;
  plugins?: Record<string, PluginClass>;
}

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
  findEntity: (entityId: string, layerId?: string) => Entity | null;
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
}

export interface MapInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewer: ViewerWithConfigs<any>;
}

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

// DroneAnimation Hook
export interface DroneAnimationConfig {
  droneId: string;
  centerLon: number;
  centerLat: number;
  radius: number;
  baseAlt: number;
  altAmp: number;
  segments: number;
  orbitDurationMs: number;
}

// ViewerProvider
export interface ViewerProviderProps {
  children: ReactNode;
}

// Enhanced Viewer with layers and renderers properties
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
  };
  plugins: Record<string, BasePlugin>;
}

// DataConnector
export type DataConnectorConfig = {
  fetchInterval?: number;
  fetchIntervals?: Record<string, number>;
};

export type DataConnectorProps = {
  dataSource: Record<string, LayerData[]>;
  config: DataConnectorConfig;
};

export type ViewerContextType = {
  viewer: ViewerWithConfigs | null;
  setViewer: React.Dispatch<React.SetStateAction<ViewerWithConfigs | null>>;
};
