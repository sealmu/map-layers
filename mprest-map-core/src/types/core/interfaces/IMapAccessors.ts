import type { ICoordinate, ICameraOrientation } from "../types/coordinates";

/**
 * Entity metadata accessible across providers
 */
export interface IEntityMetadata {
  id: string;
  name: string;
  layerId?: string;
  renderType?: string;
  show: boolean;
}

/**
 * Layer/DataSource metadata accessible across providers
 */
export interface ILayerMetadata {
  name: string;
  show: boolean;
  entityCount: number;
}

/**
 * Provider-agnostic accessors for map data
 * Each map provider implements these methods
 */
export interface IMapAccessors {
  /**
   * Get all layer names
   */
  getLayerNames(): string[];

  /**
   * Get layer metadata by name
   */
  getLayerMetadata(layerName: string): ILayerMetadata | null;

  /**
   * Get all entities in a layer
   */
  getLayerEntities(layerName: string): IEntityMetadata[];

  /**
   * Find an entity by ID, optionally in a specific layer
   */
  findEntityById(id: string, layerName?: string): IEntityMetadata | null;

  /**
   * Set entity visibility
   * @param triggerUpdate - If false, skips source update (for batch operations)
   */
  setEntityVisibility(id: string, visible: boolean, layerName?: string, triggerUpdate?: boolean): boolean;

  /**
   * Batch set entity visibility - updates multiple entities with a single source refresh
   * More efficient than calling setEntityVisibility multiple times
   */
  batchSetEntityVisibility(updates: Array<{id: string, visible: boolean}>, layerName: string): void;

  /**
   * Get native entity (for provider-specific operations)
   */
  getNativeEntity<T = unknown>(id: string, layerName?: string): T | null;

  /**
   * Select an entity
   */
  selectEntity(id: string, layerName?: string): boolean;

  /**
   * Get the selected entity ID
   */
  getSelectedEntityId(): string | null;

  /**
   * Fly to an entity
   */
  flyToEntity(
    id: string,
    options?: {
      layerName?: string;
      range?: number;
      duration?: number;
    },
  ): Promise<void>;

  /**
   * Get current camera position
   */
  getCameraPosition(): ICoordinate;

  /**
   * Get current camera orientation
   */
  getCameraOrientation(): ICameraOrientation;

  /**
   * Fly camera to a location
   */
  flyToLocation(
    coordinate: ICoordinate,
    options?: {
      heading?: number;
      pitch?: number;
      range?: number;
      duration?: number;
    },
  ): void;
}
