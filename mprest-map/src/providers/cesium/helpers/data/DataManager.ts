import {
  Entity,
  DataSource,
  PointGraphics,
  LabelGraphics,
  BillboardGraphics,
  PolylineGraphics,
  PolygonGraphics,
  ModelGraphics,
  ConstantPositionProperty,
  CallbackPositionProperty,
  Cartesian3,
} from "cesium";
import type {
  ViewerWithConfigs,
  LayerData,
  RenderTypeFromRegistry,
} from "@mprest/map";
import { createRenderTypes } from "@mprest/map";
import { createEntityFromData } from "@mprest/map";
import { enrichEntity } from "@mprest/map";

export class DataManager {
  private viewer: ViewerWithConfigs;

  constructor(viewer: ViewerWithConfigs) {
    this.viewer = viewer;
  }

  /**
   * Add a single item to a specific layer or default entity collection
   * @param item Entity options to add
   * @param layerName Layer name. Use "__default__" to add to viewer.entities directly.
   * @param renderType Optional render type for metadata
   */
  addItem(
    item: Entity.ConstructorOptions,
    layerName?: string,
    renderType?: string,
  ): Entity | null {
    // Handle default entity collection
    if (!layerName || layerName === "__default__") {
      try {
        return this.viewer.entities.add(item);
      } catch {
        return null;
      }
    }

    const dataSource = this.getDataSourceByName(layerName);
    if (!dataSource) {
      //console.warn(`Data source with name "${layerName}" not found.`);
      return null;
    }

    // Enrich the entity with metadata properties
    const finalRenderType = renderType || "custom";
    enrichEntity(item, finalRenderType, layerName);

    const entity = dataSource.entities.add(item);

    // Apply current filter state to the new entity
    if (entity) {
      entity.show =
        this.viewer.api.filters.filterData[layerName]?.types[finalRenderType] ??
        true;
    }

    return entity;
  }

  /**
   * Resolve renderer for data item based on layer and item configuration
   */
  private resolveRenderer(
    data: LayerData,
    layerId: string,
  ): {
    entityOptions: Entity.ConstructorOptions;
    rendererType: string;
    customRenderer?: (item: LayerData) => Entity.ConstructorOptions;
  } | null {
    // Get layer configuration
    const layerConfig = this.viewer.layersConfig.getLayerConfig(layerId);
    if (!layerConfig) {
      console.warn(`Layer configuration not found for layer: ${layerId}`);
      return null;
    }

    // Get renderers from viewer
    const renderers = this.viewer.renderers.getRenderers();
    const RenderTypes = createRenderTypes(renderers);

    // Determine renderer to use (layer-level takes precedence over item-level)
    let rendererType: string;
    let customRenderer:
      | ((item: LayerData) => Entity.ConstructorOptions)
      | undefined;

    if (layerConfig.customRenderer) {
      // Use layer-level custom renderer (highest precedence)
      customRenderer = layerConfig.customRenderer;
      rendererType = RenderTypes.CUSTOM;
    } else if (layerConfig.type && layerConfig.type !== RenderTypes.CUSTOM) {
      // Use layer-level type (only if not "custom" without customRenderer)
      rendererType = layerConfig.type;
    } else if (data.customRenderer) {
      // Use item-level custom renderer (when layer type is "custom" but no layer customRenderer)
      customRenderer = data.customRenderer;
      rendererType = RenderTypes.CUSTOM;
    } else if (data.renderType) {
      // Use item-level render type
      rendererType = data.renderType;
    } else {
      console.warn(`No renderer type found for layer ${layerId} or item`);
      return null;
    }

    // Prepare the type parameter for createEntityFromData
    let type: string;
    let itemToUse: LayerData = data;

    if (rendererType === RenderTypes.CUSTOM) {
      type = "custom";
      // For custom type, ensure the item has the customRenderer
      if (customRenderer) {
        itemToUse = { ...data, customRenderer };
      }
    } else {
      type = rendererType;
    }

    // Call onEntityCreate subscribers - first non-null result wins
    let entityOptions: Entity.ConstructorOptions | null = null;
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

    // If no subscriber provided options, use createEntityFromData
    if (!entityOptions) {
      // Create wrapper that calls all onEntityCreating subscribers
      const onEntityCreatingWrapper = (options: Entity.ConstructorOptions, item: LayerData) => {
        this.viewer.handlers.onEntityCreating.subscribers.forEach(cb => cb(options, item));
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
      console.warn(
        `Failed to create entity options for data item ${data.id} in layer ${layerId}`,
      );
      return null;
    }

    return { entityOptions, rendererType, customRenderer };
  }

  /**
   * Add a data item with automatic renderer resolution
   */
  addDataItem(data: LayerData, layerId: string): Entity | null {
    const resolved = this.resolveRenderer(data, layerId);
    if (!resolved) {
      console.warn(
        `Failed to resolve renderer for data item ${data.id} in layer ${layerId}`,
      );
      return null;
    }
    const { entityOptions, rendererType } = resolved!;

    // Add the item using the existing addItem method
    return this.addItem(entityOptions, layerId, rendererType);
  }

  /**
   * Update a data item with automatic renderer resolution
   */
  updateDataItem(data: LayerData, layerId: string): boolean {
    // Find the existing entity
    const entity = this.getItem(data.id, layerId);
    if (!entity) {
      return false;
    }

    // Resolve renderer to get updated entity options
    const resolved = this.resolveRenderer(data, layerId);
    if (!resolved) {
      console.warn(
        `Failed to resolve renderer for updating data item ${data.id} in layer ${layerId}`,
      );
      return false;
    }
    const { entityOptions } = resolved!;

    // Update the entity with the new options
    return this.updateEntityProperties(entity, entityOptions);
  }

  /**
   * Update a data item if it exists, otherwise add it as a new item
   */
  updateOrInsertDataItem(data: LayerData, layerId: string): Entity | null {
    // Check if the item already exists
    const existingEntity = this.getItem(data.id, layerId);

    if (existingEntity) {
      // Update existing item
      this.updateDataItem(data, layerId);
      return existingEntity;
    } else {
      // Add new item
      return this.addDataItem(data, layerId);
    }
  }

  /**
   * Update an item if it exists (by id), otherwise add it as a new item
   */
  updateOrInsertItem(
    item: Entity.ConstructorOptions,
    layerName: string,
  ): Entity | null {
    // Check if the item has an id and if an entity with that id already exists
    const id = (item as Entity.ConstructorOptions).id;
    if (id) {
      const existingEntity = this.getItem(id, layerName);
      if (existingEntity) {
        // Update existing item
        this.updateItem(existingEntity, item);
        return existingEntity;
      }
    }

    // Add new item
    return this.addItem(item, layerName);
  }

  /**
   * Add multiple data items with automatic renderer resolution
   */
  addDataItems(dataItems: LayerData[], layerId: string): (Entity | null)[] {
    return dataItems.map((data) => this.addDataItem(data, layerId));
  }

  /**
   * Add multiple items to a specific layer
   */
  addItems(
    items: Entity.ConstructorOptions[],
    layerName: string,
  ): (Entity | null)[] {
    return items.map((item) => this.addItem(item, layerName));
  }

  /**
   * Update an item by id in a specific layer or search all layers
   */
  updateItem(
    id: string,
    updates: Partial<Entity.ConstructorOptions>,
    layerName?: string,
  ): boolean;
  /**
   * Update an item by entity instance
   */
  updateItem(
    entity: Entity,
    updates: Partial<Entity.ConstructorOptions>,
  ): boolean;
  updateItem(
    idOrEntity: string | Entity,
    updates: Partial<Entity.ConstructorOptions>,
    layerName?: string,
  ): boolean {
    if (typeof idOrEntity === "string") {
      // Update by ID
      const entity = this.getItem(idOrEntity, layerName);
      if (!entity) return false;
      return this.updateEntityProperties(entity, updates);
    } else {
      // Update by entity instance
      return this.updateEntityProperties(idOrEntity, updates);
    }
  }

  // /**
  //  * Update an item by instance
  //  */
  // updateItemByInstance(
  //   entity: Entity,
  //   updates: Partial<Entity.ConstructorOptions>,
  // ): void {
  //   this.updateItem(entity.id, updates);
  // }

  /**
   * Get an item by id from a specific layer or search all layers (including default)
   * @param id Entity ID to find
   * @param layerName Optional layer name. Use "__default__" to search viewer.entities only.
   */
  getItem(id: string, layerName?: string): Entity | undefined {
    // Handle default entity collection explicitly
    if (layerName === "__default__") {
      return this.viewer.entities.getById(id);
    }

    if (layerName) {
      const dataSource = this.getDataSourceByName(layerName);
      if (!dataSource) return undefined;
      return dataSource.entities.getById(id);
    }

    // Search all data sources first
    try {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const dataSource = this.viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(id);
        if (entity) return entity;
      }
    } catch {
      //console.error('Error accessing viewer.dataSources in getItem:', e);
    }

    // Fallback: try default entity collection (viewer.entities)
    try {
      return this.viewer.entities.getById(id);
    } catch {
      return undefined;
    }
  }

  /**
   * Remove an item by id from a specific layer or search all layers (including default)
   * @param id Entity ID to remove
   * @param layerName Optional layer name. Use "__default__" to remove from viewer.entities only.
   */
  removeItem(id: string, layerName?: string): boolean {
    // Handle default entity collection explicitly
    if (layerName === "__default__") {
      return this.viewer.entities.removeById(id);
    }

    if (layerName) {
      const dataSource = this.getDataSourceByName(layerName);
      if (!dataSource) return false;
      const entity = dataSource.entities.getById(id);
      if (!entity) return false;
      dataSource.entities.remove(entity);
      return true;
    }

    // Search all data sources first
    try {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const dataSource = this.viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(id);
        if (entity) {
          dataSource.entities.remove(entity);
          return true;
        }
      }
    } catch {
      //console.error("Error accessing viewer.dataSources in removeItem:", e);
    }

    // Fallback: try default entity collection (viewer.entities)
    try {
      return this.viewer.entities.removeById(id);
    } catch {
      return false;
    }
  }

  /**
   * Get all items from a specific layer
   */
  getLayerItems(layerName: string): Entity[] | null {
    const dataSource = this.getDataSourceByName(layerName);
    if (!dataSource) {
      //console.warn(`Data source with name "${layerName}" not found.`);
      return null;
    }
    return dataSource.entities.values;
  }

  /**
   * Get item count from a specific layer
   */
  getLeyerItemCount(layerName: string): number | null {
    const dataSource = this.getDataSourceByName(layerName);
    if (!dataSource) {
      //console.warn(`Data source with name "${layerName}" not found.`);
      return null;
    }
    return dataSource.entities.values.length;
  }

  /**
   * Clear all data from a specific layer
   */
  clearLayer(layerName: string): void {
    const dataSource = this.getDataSourceByName(layerName);
    if (!dataSource) {
      //console.warn(`Data source with name "${layerName}" not found.`);
      return;
    }
    dataSource.entities.removeAll();
  }

  /**
   * Get all items from all layers
   */
  getAllItems(): Entity[] {
    const allEntities: Entity[] = [];
    const layers = this.getAllLayers();
    for (const dataSource of layers) {
      allEntities.push(...dataSource.entities.values);
    }
    return allEntities;
  }

  /**
   * Get all data sources (layers)
   */
  getAllLayers(): DataSource[] {
    const layers: DataSource[] = [];
    try {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        layers.push(this.viewer.dataSources.get(i));
      }
    } catch {
      //console.error("Error accessing viewer.dataSources in getAllLayers:", e);
    }
    return layers;
  }

  /**
   * Update entity properties with the given updates
   */
  private updateEntityProperties(
    entity: Entity,
    updates: Partial<Entity.ConstructorOptions>,
  ): boolean {
    // Update entity properties
    // Sample data formats:
    // position: Cartesian3.fromDegrees(-75.0, 40.0, 100.0) or new ConstantPositionProperty(Cartesian3.fromDegrees(-75.0, 40.0, 100.0))
    // point: { pixelSize: 10, color: Color.RED, outlineColor: Color.BLACK, outlineWidth: 2 }
    // label: { text: "My Label", font: "12pt sans-serif", fillColor: Color.WHITE, outlineColor: Color.BLACK, outlineWidth: 2, style: LabelStyle.FILL_AND_OUTLINE, verticalOrigin: VerticalOrigin.BOTTOM, pixelOffset: new Cartesian2(0, -32) }
    // billboard: { image: "path/to/image.png", scale: 1.0, color: Color.WHITE, rotation: 0, alignedAxis: Cartesian3.UNIT_Z, width: 32, height: 32 }
    // polyline: { positions: [Cartesian3.fromDegrees(-75.0, 40.0), Cartesian3.fromDegrees(-76.0, 41.0)], width: 2, material: Color.RED }
    // polygon: { hierarchy: new PolygonHierarchy([Cartesian3.fromDegrees(-75.0, 40.0), Cartesian3.fromDegrees(-76.0, 41.0), Cartesian3.fromDegrees(-74.0, 41.0)]), material: Color.BLUE.withAlpha(0.5) }
    // model: { uri: "path/to/model.gltf", scale: 1.0, minimumPixelSize: 128 }
    // name: "My Entity Name"
    if (updates.position !== undefined) {
      if (
        updates.position instanceof ConstantPositionProperty ||
        updates.position instanceof CallbackPositionProperty
      ) {
        entity.position = updates.position;
      } else {
        // Assume it's Cartesian3
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
    // Add other properties as needed

    return true;
  }

  /**
   * Get data source by name
   */
  private getDataSourceByName(name: string): DataSource | null {
    try {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const dataSource = this.viewer.dataSources.get(i);
        if (dataSource.name === name) {
          return dataSource;
        }
      }
    } catch (e) {
      console.error(
        "Error accessing viewer.dataSources in getDataSourceByName:",
        e,
      );
    }

    //console.log(`Data source with name "${name}" not found.`);
    return null;
  }
}
