import type { ComponentType } from "react";
import type { IMapCamera } from "./IMapCamera";
import type { IMapAccessors } from "./IMapAccessors";
import type { IDataManager } from "./IDataManager";
import type { IRendererRegistry, ILayerData, ILayerProps } from "../types/layer";
import type { IMapApi } from "../types/features";

/**
 * Provider initialization options
 */
export interface IProviderOptions {
  /** Container element ID or ref */
  container: HTMLElement | string;
  /** Access token (for providers that require it) */
  accessToken?: string;
  /** Initial view settings */
  initialView?: {
    longitude: number;
    latitude: number;
    height?: number;
    heading?: number;
    pitch?: number;
  };
}

/**
 * Provider capabilities - what features the provider supports
 */
export interface IProviderCapabilities {
  /** Supports 3D terrain/globe */
  supports3D: boolean;
  /** Supports 2D flat map */
  supports2D: boolean;
  /** Supports camera tilt (3D) */
  supportsTilt: boolean;
  /** Supports heading/rotation */
  supportsHeading: boolean;
  /** Supports 3D models */
  supportsModels: boolean;
  /** Supports extruded polygons */
  supportsExtrusion: boolean;
  /** Supports terrain clamping */
  supportsTerrainClamping: boolean;
}

/**
 * Provider instance interface - what a created provider provides
 */
export interface IProviderInstance<
  R extends IRendererRegistry = IRendererRegistry,
> {
  /** Provider type identifier */
  readonly type: string;

  /** Provider capabilities */
  readonly capabilities: IProviderCapabilities;

  /** Camera control */
  readonly camera: IMapCamera;

  /** Map accessors for queries */
  readonly accessors: IMapAccessors;

  /** Data manager for entity CRUD */
  readonly dataManager: IDataManager;

  /** Map API */
  readonly api: IMapApi;

  /** Layer configuration accessor */
  readonly layersConfig: {
    getLayerConfig: (layerId: string) => ILayerProps<ILayerData, R> | undefined;
    getAllLayerConfigs: () => ILayerProps<ILayerData, R>[];
  };

  /** Check if destroyed */
  isDestroyed(): boolean;

  /** Destroy the provider */
  destroy(): void;

  /** Get native viewer/map instance */
  getNativeViewer<T = unknown>(): T;
}

/**
 * Provider factory interface
 * Each map provider (Cesium, Leaflet, Mapbox) implements this
 */
export interface IProviderFactory<
  R extends IRendererRegistry = IRendererRegistry,
> {
  /** Provider type identifier */
  readonly type: string;

  /** Provider capabilities */
  readonly capabilities: IProviderCapabilities;

  /** Create a provider instance */
  create(options: IProviderOptions): Promise<IProviderInstance<R>>;

  /** Get the React Map component for this provider */
  getMapComponent(): ComponentType<unknown>;
}

/**
 * Provider registry type
 */
export interface IProviderRegistry {
  /** Register a provider factory */
  register<R extends IRendererRegistry>(factory: IProviderFactory<R>): void;

  /** Get a provider factory by type */
  get<R extends IRendererRegistry>(type: string): IProviderFactory<R> | undefined;

  /** Check if a provider is registered */
  has(type: string): boolean;

  /** Get all registered provider types */
  getTypes(): string[];

  /** Get default provider type */
  getDefaultType(): string | undefined;

  /** Set default provider type */
  setDefaultType(type: string): void;
}
