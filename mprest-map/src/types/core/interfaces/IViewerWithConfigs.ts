import type { IMapAccessors } from "./IMapAccessors";
import type { IMapCamera } from "./IMapCamera";
import type {
  IMapApi,
  ILayerProps,
  ILayerData,
  IRendererRegistry,
  IEventHandler,
} from "../types";
import type { IMapEntity, EntityChangeStatus } from "./IMapEntity";
import type { ICoordinate, IScreenPosition } from "../types/coordinates";

/**
 * Provider-agnostic click location
 */
export interface IClickLocation {
  coordinate: ICoordinate;
  screenPosition: IScreenPosition;
}

/**
 * Provider-agnostic event handlers interface
 */
export interface IViewerHandlers {
  onClick: IEventHandler<
    (entity: IMapEntity | null, location: IClickLocation) => void
  >;
  onSelecting: IEventHandler<
    (entity: IMapEntity, location: IClickLocation) => void
  >;
  onSelected: IEventHandler<
    (entity: IMapEntity | null, location?: IClickLocation) => void
  >;
  onChangePosition: IEventHandler<(location: IClickLocation | null) => void>;
  onEntityChange: IEventHandler<
    (entity: IMapEntity, status: EntityChangeStatus, layerName: string) => void
  >;
  onApiChange: IEventHandler<(api: IMapApi) => void>;
}

/**
 * Provider-agnostic layer config accessor
 */
export interface ILayerConfigAccessor<
  T = ILayerData,
  R extends IRendererRegistry = IRendererRegistry,
> {
  getLayerConfig: (layerId: string) => ILayerProps<T, R> | undefined;
  getAllLayerConfigs: () => ILayerProps<T, R>[];
}

/**
 * Provider-agnostic viewer interface
 * This is what features and extensions should depend on
 */
export interface IViewerWithConfigs<
  R extends IRendererRegistry = IRendererRegistry,
> {
  /** Provider type identifier */
  readonly providerType: "cesium" | "leaflet" | "mapbox" | string;

  /** Layer configuration accessor */
  readonly layersConfig: ILayerConfigAccessor<ILayerData, R>;

  /** Map API for features */
  readonly api: IMapApi;

  /** Map accessors for entity/layer queries */
  readonly accessors: IMapAccessors;

  /** Camera control */
  readonly camera: IMapCamera;

  /** Event handlers */
  readonly handlers: IViewerHandlers;

  /** Check if viewer is destroyed */
  isDestroyed(): boolean;

  /** Access the native viewer (CesiumViewer, L.Map, etc.) */
  getNativeViewer<T = unknown>(): T;
}

/**
 * Provider-agnostic viewer context type
 */
export interface IViewerContextType<
  R extends IRendererRegistry = IRendererRegistry,
> {
  viewer: IViewerWithConfigs<R> | null;
  setViewer: React.Dispatch<
    React.SetStateAction<IViewerWithConfigs<R> | null>
  >;
}
