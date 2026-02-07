import {
  Cartesian3,
  ConstantPositionProperty,
  CallbackPositionProperty,
  PointGraphics,
  LabelGraphics,
  BillboardGraphics,
  PolylineGraphics,
  PolygonGraphics,
  ModelGraphics,
  type Entity,
  type DataSource,
  type DataSourceCollection,
  type EntityCollection,
} from "cesium";
import {
  createLogger,
  type IDataManager,
  type IMapEntity,
  type IEntityOptions,
  type IDataSource,
} from "@mprest/map-core";

const logger = createLogger("CesiumDataManager");
import type { ViewerWithConfigs, LayerData, RenderTypeFromRegistry } from "./types";
import { CesiumMapEntity, toCesiumEntityOptions, updateCesiumEntity } from "./CesiumMapEntity";
import { CesiumDataSource } from "./CesiumDataSource";
import { enrichEntity, createEntityFromData } from "./pipeline";
import { createRenderTypes } from "./types";

/**
 * Cesium implementation of IDataManager
 * Accepts Cesium-native LayerData (with Cartesian3 positions, Cesium Color, etc.)
 */
export class CesiumDataManager implements IDataManager<LayerData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private viewer: ViewerWithConfigs<any>;
  private dataSources: DataSourceCollection;
  private defaultEntities: EntityCollection;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(viewer: ViewerWithConfigs<any>) {
    this.viewer = viewer;
    this.dataSources = viewer.dataSources;
    this.defaultEntities = viewer.entities;
  }

  // ============================================
  // Single Item Operations (IDataManager interface)
  // ============================================

  addItem(options: IEntityOptions, layerName?: string): IMapEntity | null {
    const cesiumOptions = toCesiumEntityOptions(options);
    return this.addCesiumItem(cesiumOptions, layerName);
  }

  updateItem(
    id: string,
    updates: Partial<IEntityOptions>,
    layerName?: string,
  ): boolean {
    const entity = this.getCesiumEntity(id, layerName);
    if (!entity) return false;
    updateCesiumEntity(entity, updates);
    return true;
  }

  updateItemByEntity(
    entity: IMapEntity,
    updates: Partial<IEntityOptions>,
  ): boolean {
    const cesiumEntity = entity.getNativeEntity<Entity>();
    updateCesiumEntity(cesiumEntity, updates);
    return true;
  }

  removeItem(id: string, layerName?: string): boolean {
    // Handle default entity collection explicitly
    if (layerName === "__default__") {
      return this.defaultEntities.removeById(id);
    }

    if (layerName) {
      const layer = this.getLayerByName(layerName);
      if (!layer) return false;
      return layer.removeById(id);
    }

    // Search all data sources first
    try {
      const layers = this.getAllLayers();
      for (const layer of layers) {
        if (layer.getById(id)) {
          return layer.removeById(id);
        }
      }
    } catch {
      // Ignore errors
    }

    // Fallback: try default entity collection
    try {
      return this.defaultEntities.removeById(id);
    } catch {
      return false;
    }
  }

  getItem(id: string, layerName?: string): IMapEntity | undefined {
    const entity = this.getCesiumEntity(id, layerName);
    if (!entity) return undefined;
    return new CesiumMapEntity(entity);
  }

  // ============================================
  // Batch Operations
  // ============================================

  addItems(items: IEntityOptions[], layerName: string): (IMapEntity | null)[] {
    return items.map((item) => this.addItem(item, layerName));
  }

  // ============================================
  // Layer Operations
  // ============================================

  getLayerItems(layerName: string): IMapEntity[] | null {
    const layer = this.getLayerByName(layerName);
    if (!layer) return null;
    return layer.getAll();
  }

  getLayerItemCount(layerName: string): number | null {
    const layer = this.getLayerByName(layerName);
    if (!layer) return null;
    return layer.length;
  }

  clearLayer(layerName: string): void {
    const layer = this.getLayerByName(layerName);
    if (!layer) return;
    layer.removeAll();
  }

  // ============================================
  // Cross-Layer Operations
  // ============================================

  getAllItems(): IMapEntity[] {
    const allEntities: IMapEntity[] = [];
    const layers = this.getAllLayers();
    for (const layer of layers) {
      allEntities.push(...layer.getAll());
    }
    return allEntities;
  }

  getAllLayers(): IDataSource[] {
    const layers: IDataSource[] = [];
    try {
      for (let i = 0; i < this.dataSources.length; i++) {
        const ds = this.dataSources.get(i);
        layers.push(new CesiumDataSource(ds));
      }
    } catch {
      // Ignore errors
    }
    return layers;
  }

  // ============================================
  // Data-Driven Operations (with renderer resolution)
  // ============================================

  addDataItem(data: LayerData, layerId: string): IMapEntity | null {
    const resolved = this.resolveRenderer(data, layerId);
    if (!resolved) return null;

    const { entityOptions, rendererType } = resolved;
    return this.addCesiumItem(entityOptions, layerId, rendererType);
  }

  addDataItems(
    dataItems: LayerData[],
    layerId: string,
  ): (IMapEntity | null)[] {
    return dataItems.map((data) => this.addDataItem(data, layerId));
  }

  updateDataItem(data: LayerData, layerId: string): boolean {
    const entity = this.getCesiumEntity(data.id, layerId);
    if (!entity) return false;

    const resolved = this.resolveRenderer(data, layerId);
    if (!resolved) return false;

    return this.updateCesiumEntityProperties(entity, resolved.entityOptions);
  }

  updateOrInsertDataItem(data: LayerData, layerId: string): IMapEntity | null {
    const existingEntity = this.getCesiumEntity(data.id, layerId);
    if (existingEntity) {
      this.updateDataItem(data, layerId);
      return new CesiumMapEntity(existingEntity);
    }
    return this.addDataItem(data, layerId);
  }

  // ============================================
  // Cesium-Specific Methods (for backwards compatibility)
  // ============================================

  /**
   * Add a Cesium entity directly (backwards compatible)
   */
  addCesiumItem(
    item: Entity.ConstructorOptions,
    layerName?: string,
    renderType?: string,
  ): IMapEntity | null {
    // Handle default entity collection
    if (!layerName || layerName === "__default__") {
      try {
        const entity = this.defaultEntities.add(item);
        return new CesiumMapEntity(entity);
      } catch {
        return null;
      }
    }

    const nativeDataSource = this.getNativeDataSourceByName(layerName);
    if (!nativeDataSource) return null;

    // Enrich the entity with metadata properties
    const finalRenderType = renderType || "custom";
    enrichEntity(item, finalRenderType, layerName);

    const entity = nativeDataSource.entities.add(item);

    // Apply current filter state to the new entity
    if (entity) {
      entity.show =
        this.viewer.api?.filters?.filterData?.[layerName]?.types?.[finalRenderType] ??
        true;
    }

    return entity ? new CesiumMapEntity(entity) : null;
  }

  /**
   * Get native Cesium entity (backwards compatible)
   */
  getCesiumEntity(id: string, layerName?: string): Entity | undefined {
    // Handle default entity collection explicitly
    if (layerName === "__default__") {
      return this.defaultEntities.getById(id);
    }

    if (layerName) {
      const nativeDataSource = this.getNativeDataSourceByName(layerName);
      if (!nativeDataSource) return undefined;
      return nativeDataSource.entities.getById(id);
    }

    // Search all layers first
    try {
      const layers = this.getAllLayers();
      for (const layer of layers) {
        const mapEntity = layer.getById(id);
        if (mapEntity) {
          return mapEntity.getNativeEntity<Entity>();
        }
      }
    } catch {
      // Ignore errors
    }

    // Fallback: try default entity collection
    try {
      return this.defaultEntities.getById(id);
    } catch {
      return undefined;
    }
  }

  /**
   * Update or insert a Cesium entity directly (backwards compatible)
   */
  updateOrInsertCesiumItem(
    item: Entity.ConstructorOptions,
    layerName: string,
  ): IMapEntity | null {
    const id = item.id;
    if (id) {
      const existingEntity = this.getCesiumEntity(id, layerName);
      if (existingEntity) {
        this.updateCesiumEntityProperties(existingEntity, item);
        return new CesiumMapEntity(existingEntity);
      }
    }
    return this.addCesiumItem(item, layerName);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private getLayerByName(name: string): CesiumDataSource | null {
    const layers = this.getAllLayers();
    const layer = layers.find((l) => l.name === name);
    return layer ? (layer as CesiumDataSource) : null;
  }

  private getNativeDataSourceByName(name: string): DataSource | null {
    const layer = this.getLayerByName(name);
    return layer ? layer.getNativeDataSource<DataSource>() : null;
  }

  private resolveRenderer(
    data: LayerData,
    layerId: string,
  ): {
    entityOptions: Entity.ConstructorOptions;
    rendererType: string;
    customRenderer?: (item: LayerData) => Entity.ConstructorOptions;
  } | null {
    // Get layer configuration
    const layerConfig = this.viewer.layersConfig?.getLayerConfig(layerId);
    if (!layerConfig) {
      logger.warn(`Layer configuration not found for layer: ${layerId}`, { layerId });
      return null;
    }

    // Get renderers from viewer
    const renderers = this.viewer.renderers?.getRenderers();
    if (!renderers) {
      logger.warn("No renderers available", { layerId });
      return null;
    }

    const RenderTypes = createRenderTypes(renderers);

    // Determine renderer to use
    let rendererType: string;
    let customRenderer:
      | ((item: LayerData) => Entity.ConstructorOptions)
      | undefined;

    if (layerConfig.customRenderer) {
      customRenderer = layerConfig.customRenderer;
      rendererType = RenderTypes.CUSTOM;
    } else if (layerConfig.type && layerConfig.type !== RenderTypes.CUSTOM) {
      rendererType = layerConfig.type;
    } else if (data.customRenderer) {
      customRenderer = data.customRenderer;
      rendererType = RenderTypes.CUSTOM;
    } else if (data.renderType) {
      rendererType = data.renderType;
    } else {
      logger.warn(`No renderer type found for layer ${layerId} or item`, { layerId, itemId: data.id });
      return null;
    }

    // Prepare the type parameter
    let type: string;
    let itemToUse: LayerData = data;

    if (rendererType === RenderTypes.CUSTOM) {
      type = "custom";
      if (customRenderer) {
        itemToUse = { ...data, customRenderer };
      }
    } else {
      type = rendererType;
    }

    // Call onEntityCreate subscribers
    let entityOptions: Entity.ConstructorOptions | null = null;
    if (this.viewer.handlers?.onEntityCreate?.subscribers) {
      for (const callback of this.viewer.handlers.onEntityCreate.subscribers) {
        const result = callback(
          type as RenderTypeFromRegistry<typeof renderers>,
          itemToUse,
          renderers,
          layerId,
        );
        if (result) {
          entityOptions = result;
          break;
        }
      }
    }

    // If no subscriber provided options, use createEntityFromData
    if (!entityOptions) {
      const layerOnEntityCreating = layerConfig.onEntityCreating as
        ((options: Entity.ConstructorOptions, item: LayerData) => boolean | void) | undefined;
      const onEntityCreatingWrapper = (
        options: Entity.ConstructorOptions,
        item: LayerData,
      ): boolean | void => {
        // Layer-level onEntityCreating first
        if (layerOnEntityCreating?.(options, item) === false) return false;
        // Then map-level subscribers
        for (const cb of this.viewer.handlers?.onEntityCreating?.subscribers ?? []) {
          if (cb(options, item) === false) return false;
        }
      };
      entityOptions = createEntityFromData(
        type as RenderTypeFromRegistry<typeof renderers>,
        itemToUse,
        renderers,
        layerId,
        onEntityCreatingWrapper,
      );
    }

    if (!entityOptions) {
      logger.warn(
        `Failed to create entity options for data item ${data.id} in layer ${layerId}`,
        { layerId, itemId: data.id }
      );
      return null;
    }

    return { entityOptions, rendererType, customRenderer };
  }

  private updateCesiumEntityProperties(
    entity: Entity,
    updates: Partial<Entity.ConstructorOptions>,
  ): boolean {
    if (updates.position !== undefined) {
      if (
        updates.position instanceof ConstantPositionProperty ||
        updates.position instanceof CallbackPositionProperty
      ) {
        entity.position = updates.position;
      } else {
        entity.position = new ConstantPositionProperty(
          updates.position as Cartesian3,
        );
      }
    }
    if (updates.point !== undefined) {
      entity.point =
        updates.point instanceof PointGraphics
          ? updates.point
          : new PointGraphics(updates.point);
    }
    if (updates.label !== undefined) {
      entity.label =
        updates.label instanceof LabelGraphics
          ? updates.label
          : new LabelGraphics(updates.label);
    }
    if (updates.billboard !== undefined) {
      entity.billboard =
        updates.billboard instanceof BillboardGraphics
          ? updates.billboard
          : new BillboardGraphics(updates.billboard);
    }
    if (updates.polyline !== undefined) {
      entity.polyline =
        updates.polyline instanceof PolylineGraphics
          ? updates.polyline
          : new PolylineGraphics(updates.polyline);
    }
    if (updates.polygon !== undefined) {
      entity.polygon =
        updates.polygon instanceof PolygonGraphics
          ? updates.polygon
          : new PolygonGraphics(updates.polygon);
    }
    if (updates.model !== undefined) {
      entity.model =
        updates.model instanceof ModelGraphics
          ? updates.model
          : new ModelGraphics(updates.model);
    }
    if (updates.name !== undefined) entity.name = updates.name;

    return true;
  }
}

/**
 * Create a CesiumDataManager instance
 */
export function createCesiumDataManager(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewer: ViewerWithConfigs<any>,
): CesiumDataManager {
  return new CesiumDataManager(viewer);
}
