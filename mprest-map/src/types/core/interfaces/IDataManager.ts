import type { IMapEntity, IEntityOptions } from "./IMapEntity";
import type { IDataSource } from "./IDataSource";
import type { ILayerData } from "../types/layer";

/**
 * Provider-agnostic data manager interface
 * Each map provider implements this interface
 */
export interface IDataManager {
  // ============================================
  // Single Item Operations
  // ============================================

  /**
   * Add a single entity to a layer
   * @param options Entity options
   * @param layerName Target layer name (use "__default__" for default collection)
   */
  addItem(options: IEntityOptions, layerName?: string): IMapEntity | null;

  /**
   * Update an entity by ID
   * @param id Entity ID
   * @param updates Partial entity options to update
   * @param layerName Layer to search in (searches all if not specified)
   */
  updateItem(
    id: string,
    updates: Partial<IEntityOptions>,
    layerName?: string,
  ): boolean;

  /**
   * Update an entity by reference
   * @param entity Entity instance
   * @param updates Partial entity options to update
   */
  updateItemByEntity(
    entity: IMapEntity,
    updates: Partial<IEntityOptions>,
  ): boolean;

  /**
   * Remove an entity by ID
   * @param id Entity ID
   * @param layerName Layer to search in (searches all if not specified)
   */
  removeItem(id: string, layerName?: string): boolean;

  /**
   * Get an entity by ID
   * @param id Entity ID
   * @param layerName Layer to search in (searches all if not specified)
   */
  getItem(id: string, layerName?: string): IMapEntity | undefined;

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Add multiple entities to a layer
   */
  addItems(items: IEntityOptions[], layerName: string): (IMapEntity | null)[];

  // ============================================
  // Layer Operations
  // ============================================

  /**
   * Get all entities in a layer
   */
  getLayerItems(layerName: string): IMapEntity[] | null;

  /**
   * Get entity count in a layer
   */
  getLayerItemCount(layerName: string): number | null;

  /**
   * Remove all entities from a layer
   */
  clearLayer(layerName: string): void;

  // ============================================
  // Cross-Layer Operations
  // ============================================

  /**
   * Get all entities from all layers
   */
  getAllItems(): IMapEntity[];

  /**
   * Get all data sources/layers
   */
  getAllLayers(): IDataSource[];

  // ============================================
  // Data-Driven Operations (with renderer resolution)
  // ============================================

  /**
   * Add a data item with automatic renderer resolution
   */
  addDataItem(data: ILayerData, layerId: string): IMapEntity | null;

  /**
   * Add multiple data items with automatic renderer resolution
   */
  addDataItems(dataItems: ILayerData[], layerId: string): (IMapEntity | null)[];

  /**
   * Update a data item with automatic renderer resolution
   */
  updateDataItem(data: ILayerData, layerId: string): boolean;

  /**
   * Update or insert a data item
   */
  updateOrInsertDataItem(data: ILayerData, layerId: string): IMapEntity | null;
}
