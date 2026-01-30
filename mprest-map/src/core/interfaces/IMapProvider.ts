import type { IMapCamera } from "./IMapCamera";
import type { IDataManager } from "./IDataManager";
import type { IDataSource } from "./IDataSource";
import type { IMapEntity, EntityChangeStatus } from "./IMapEntity";
import type { ICoordinate, IScreenPosition, ICameraOrientation } from "../types/coordinates";

/**
 * Map click location with both geographic and screen coordinates
 */
export interface IMapClickLocation {
  coordinate: ICoordinate;
  screenPosition: IScreenPosition;
}

/**
 * Provider initialization options
 */
export interface IMapProviderOptions {
  /** Container element for the map */
  container: HTMLElement;
  /** Access token (Cesium Ion, Mapbox, etc.) */
  accessToken?: string;
  /** Initial camera view */
  initialView?: {
    position: ICoordinate;
    orientation?: ICameraOrientation;
  };
}

/**
 * Event handler function types
 */
export interface IMapProviderEvents {
  onClick: (
    entity: IMapEntity | null,
    location: IMapClickLocation,
  ) => boolean | void;

  onSelecting: (
    entity: IMapEntity,
    location: IMapClickLocation,
  ) => boolean | void;

  onClickPrevented: (
    entity: IMapEntity,
    location: IMapClickLocation,
  ) => boolean | void;

  onSelected: (
    entity: IMapEntity | null,
    location?: IMapClickLocation,
  ) => boolean | void;

  onChangePosition: (
    location: IMapClickLocation | null,
  ) => boolean | void;

  onEntityChange: (
    entity: IMapEntity,
    status: EntityChangeStatus,
    layerName: string,
  ) => boolean | void;
}

/**
 * Main map provider interface
 * Each map implementation (Cesium, Leaflet, Mapbox) implements this
 */
export interface IMapProvider {
  /** Provider type identifier */
  readonly type: string;

  /** Camera control interface */
  readonly camera: IMapCamera;

  /** Data management interface */
  readonly dataManager: IDataManager;

  // ============================================
  // Data Source Management
  // ============================================

  /**
   * Create and add a new data source/layer
   */
  addDataSource(name: string): IDataSource;

  /**
   * Remove a data source by name
   */
  removeDataSource(name: string): boolean;

  /**
   * Get a data source by name
   */
  getDataSource(name: string): IDataSource | undefined;

  /**
   * Get all data sources
   */
  getAllDataSources(): IDataSource[];

  // ============================================
  // Selection
  // ============================================

  /**
   * Get the currently selected entity
   */
  getSelectedEntity(): IMapEntity | null;

  /**
   * Select an entity (or deselect if null)
   */
  selectEntity(entity: IMapEntity | null): void;

  // ============================================
  // Events
  // ============================================

  /**
   * Subscribe to a map event
   * @returns Unsubscribe function
   */
  on<K extends keyof IMapProviderEvents>(
    event: K,
    callback: IMapProviderEvents[K],
  ): () => void;

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Check if the provider has been destroyed
   */
  isDestroyed(): boolean;

  /**
   * Destroy the provider and clean up resources
   */
  destroy(): void;

  /**
   * Access the native viewer (Cesium.Viewer, L.Map, etc.)
   */
  getNativeViewer<T = unknown>(): T;
}
