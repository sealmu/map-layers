import type { IMapEntity, IEntityOptions, EntityChangeStatus } from "./IMapEntity";

/**
 * Entity change event callback
 */
export type EntityChangeCallback = (
  entity: IMapEntity,
  status: EntityChangeStatus,
) => void;

/**
 * Provider-agnostic data source (layer) interface
 */
export interface IDataSource {
  /** Data source/layer name */
  readonly name: string;

  /** Visibility flag for the entire layer */
  show: boolean;

  /** Number of entities in this data source */
  readonly length: number;

  /**
   * Add a new entity to this data source
   */
  add(options: IEntityOptions): IMapEntity;

  /**
   * Remove an entity from this data source
   */
  remove(entity: IMapEntity): boolean;

  /**
   * Remove an entity by ID
   */
  removeById(id: string): boolean;

  /**
   * Remove all entities from this data source
   */
  removeAll(): void;

  /**
   * Get an entity by ID
   */
  getById(id: string): IMapEntity | undefined;

  /**
   * Get all entities in this data source
   */
  getAll(): IMapEntity[];

  /**
   * Subscribe to entity change events
   * @returns Unsubscribe function
   */
  onEntityChange(callback: EntityChangeCallback): () => void;

  /**
   * Access the native data source (Cesium.CustomDataSource, etc.)
   */
  getNativeDataSource<T = unknown>(): T;
}
