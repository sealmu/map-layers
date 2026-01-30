import type {
  IDataManager,
  IMapEntity,
  IEntityOptions,
  IDataSource,
  ILayerData,
} from "@mprest/map-core";
import type {
  ViewerWithConfigs,
  LayerData,
  RenderTypeFromRegistry,
  MapLibreFeature,
  RendererRegistry,
} from "./types";
import {
  MapLibreMapEntity,
  toMapLibreFeature,
  updateMapLibreFeature,
} from "./MapLibreMapEntity";
import { MapLibreDataSource } from "./MapLibreDataSource";
import { createRenderTypes } from "./types";

/**
 * MapLibre implementation of IDataManager
 * Provides provider-agnostic data management for MapLibre maps
 */
export class MapLibreDataManager implements IDataManager {
  private viewer: ViewerWithConfigs;
  private dataSources: Map<string, MapLibreDataSource> = new Map();

  constructor(viewer: ViewerWithConfigs) {
    this.viewer = viewer;
  }

  // ============================================
  // Single Item Operations (IDataManager interface)
  // ============================================

  addItem(options: IEntityOptions, layerName?: string): IMapEntity | null {
    const feature = toMapLibreFeature(options);
    return this.addMapLibreItem(feature, layerName);
  }

  updateItem(
    id: string,
    updates: Partial<IEntityOptions>,
    layerName?: string,
  ): boolean {
    const feature = this.getMapLibreFeature(id, layerName);
    if (!feature) return false;
    updateMapLibreFeature(feature, updates);
    this.updateSourceForLayer(layerName);
    return true;
  }

  updateItemByEntity(
    entity: IMapEntity,
    updates: Partial<IEntityOptions>,
  ): boolean {
    const feature = entity.getNativeEntity<MapLibreFeature>();
    updateMapLibreFeature(feature, updates);
    if (feature.layerId) {
      this.updateSourceForLayer(feature.layerId);
    }
    return true;
  }

  removeItem(id: string, layerName?: string): boolean {
    if (layerName) {
      const dataSource = this.dataSources.get(layerName);
      if (!dataSource) return false;
      return dataSource.removeById(id);
    }

    // Search all data sources
    for (const dataSource of this.dataSources.values()) {
      if (dataSource.removeById(id)) {
        return true;
      }
    }

    // Try feature store
    const store = this.viewer.featureStore;
    for (const [layer, features] of store.entries()) {
      if (features.has(id)) {
        features.delete(id);
        this.updateSourceForLayer(layer);
        return true;
      }
    }

    return false;
  }

  getItem(id: string, layerName?: string): IMapEntity | undefined {
    const feature = this.getMapLibreFeature(id, layerName);
    if (!feature) return undefined;
    return new MapLibreMapEntity(feature);
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
    const dataSource = this.dataSources.get(layerName);
    if (dataSource) {
      return dataSource.getAll();
    }

    const layerFeatures = this.viewer.featureStore.get(layerName);
    if (!layerFeatures) return null;

    return Array.from(layerFeatures.values()).map(
      (f) => new MapLibreMapEntity(f),
    );
  }

  getLayerItemCount(layerName: string): number | null {
    const dataSource = this.dataSources.get(layerName);
    if (dataSource) {
      return dataSource.length;
    }

    const layerFeatures = this.viewer.featureStore.get(layerName);
    if (!layerFeatures) return null;
    return layerFeatures.size;
  }

  clearLayer(layerName: string): void {
    const dataSource = this.dataSources.get(layerName);
    if (dataSource) {
      dataSource.removeAll();
      return;
    }

    const layerFeatures = this.viewer.featureStore.get(layerName);
    if (layerFeatures) {
      layerFeatures.clear();
      this.updateSourceForLayer(layerName);
    }
  }

  // ============================================
  // Cross-Layer Operations
  // ============================================

  getAllItems(): IMapEntity[] {
    const allEntities: IMapEntity[] = [];
    for (const dataSource of this.dataSources.values()) {
      allEntities.push(...dataSource.getAll());
    }
    for (const layerFeatures of this.viewer.featureStore.values()) {
      for (const feature of layerFeatures.values()) {
        allEntities.push(new MapLibreMapEntity(feature));
      }
    }
    return allEntities;
  }

  getAllLayers(): IDataSource[] {
    return Array.from(this.dataSources.values());
  }

  // ============================================
  // Data-Driven Operations (with renderer resolution)
  // ============================================

  addDataItem(data: ILayerData, layerId: string): IMapEntity | null {
    const layerData = this.toLayerData(data);
    const resolved = this.resolveRenderer(layerData, layerId);
    if (!resolved) return null;

    const { feature, rendererType } = resolved;
    return this.addMapLibreItem(feature, layerId, rendererType);
  }

  addDataItems(
    dataItems: ILayerData[],
    layerId: string,
  ): (IMapEntity | null)[] {
    return dataItems.map((data) => this.addDataItem(data, layerId));
  }

  updateDataItem(data: ILayerData, layerId: string): boolean {
    const feature = this.getMapLibreFeature(data.id, layerId);
    if (!feature) return false;

    const layerData = this.toLayerData(data);
    const resolved = this.resolveRenderer(layerData, layerId);
    if (!resolved) return false;

    // Update feature properties from resolved feature
    Object.assign(feature.properties || {}, resolved.feature.properties);
    this.updateSourceForLayer(layerId);
    return true;
  }

  updateOrInsertDataItem(data: ILayerData, layerId: string): IMapEntity | null {
    const existingFeature = this.getMapLibreFeature(data.id, layerId);
    if (existingFeature) {
      this.updateDataItem(data, layerId);
      return new MapLibreMapEntity(existingFeature);
    }
    return this.addDataItem(data, layerId);
  }

  // ============================================
  // MapLibre-Specific Methods
  // ============================================

  addMapLibreItem(
    feature: MapLibreFeature,
    layerName?: string,
    renderType?: string,
  ): IMapEntity | null {
    if (!layerName) {
      layerName = "__default__";
    }

    // Enrich the feature with metadata
    feature.layerId = layerName;
    feature.renderType = renderType || "custom";
    if (feature.properties) {
      feature.properties.layerId = layerName;
      feature.properties.rendererType = renderType || "custom";
    }

    // Store in feature store
    let layerFeatures = this.viewer.featureStore.get(layerName);
    if (!layerFeatures) {
      layerFeatures = new Map();
      this.viewer.featureStore.set(layerName, layerFeatures);
    }
    layerFeatures.set(feature.id, feature);

    // Apply current filter state
    if (feature.properties && this.viewer.api?.filters?.filterData?.[layerName]) {
      const filterTypes = this.viewer.api.filters.filterData[layerName]?.types;
      if (filterTypes && feature.renderType) {
        feature.properties.show = filterTypes[feature.renderType] ?? true;
      }
    }

    this.updateSourceForLayer(layerName);
    return new MapLibreMapEntity(feature);
  }

  getMapLibreFeature(id: string, layerName?: string): MapLibreFeature | undefined {
    if (layerName) {
      const dataSource = this.dataSources.get(layerName);
      if (dataSource) {
        return dataSource.getFeature(id);
      }
      const layerFeatures = this.viewer.featureStore.get(layerName);
      return layerFeatures?.get(id);
    }

    // Search all layers
    for (const dataSource of this.dataSources.values()) {
      const feature = dataSource.getFeature(id);
      if (feature) return feature;
    }

    for (const layerFeatures of this.viewer.featureStore.values()) {
      const feature = layerFeatures.get(id);
      if (feature) return feature;
    }

    return undefined;
  }

  registerDataSource(name: string, dataSource: MapLibreDataSource): void {
    this.dataSources.set(name, dataSource);
  }

  unregisterDataSource(name: string): void {
    this.dataSources.delete(name);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private toLayerData(data: ILayerData): LayerData {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
      positions: data.positions,
      view: data.view,
      renderType: data.renderType,
      customRenderer: data.customRenderer as LayerData["customRenderer"],
      data: data.data,
    };
  }

  private resolveRenderer(
    data: LayerData,
    layerId: string,
  ): {
    feature: MapLibreFeature;
    rendererType: string;
    customRenderer?: (item: LayerData) => MapLibreFeature;
  } | null {
    const layerConfig = this.viewer.layersConfig?.getLayerConfig(layerId);
    if (!layerConfig) {
      console.warn(`Layer configuration not found for layer: ${layerId}`);
      return null;
    }

    const renderers = this.viewer.renderers?.getRenderers();
    if (!renderers) {
      console.warn("No renderers available");
      return null;
    }

    const RenderTypes = createRenderTypes(renderers);

    let rendererType: string;
    let customRenderer:
      | ((item: LayerData) => MapLibreFeature)
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
      console.warn(`No renderer type found for layer ${layerId} or item`);
      return null;
    }

    let feature: MapLibreFeature | null = null;

    // Call onEntityCreate subscribers
    if (this.viewer.handlers?.onEntityCreate?.subscribers) {
      for (const callback of this.viewer.handlers.onEntityCreate.subscribers) {
        const result = callback(
          rendererType as RenderTypeFromRegistry<RendererRegistry>,
          data,
          renderers,
          layerId,
        );
        if (result) {
          feature = result;
          break;
        }
      }
    }

    // If no subscriber provided a feature, use renderer
    if (!feature) {
      if (customRenderer) {
        feature = customRenderer(data);
      } else {
        const renderer = renderers[rendererType];
        if (renderer) {
          feature = renderer(data);
        }
      }
    }

    if (!feature) {
      console.warn(
        `Failed to create feature for data item ${data.id} in layer ${layerId}`,
      );
      return null;
    }

    // Call onEntityCreating subscribers
    if (this.viewer.handlers?.onEntityCreating?.subscribers) {
      for (const cb of this.viewer.handlers.onEntityCreating.subscribers) {
        cb(feature, data);
      }
    }

    return { feature, rendererType, customRenderer };
  }

  private updateSourceForLayer(layerName?: string): void {
    if (!layerName) return;

    const map = this.viewer.map;
    const source = map.getSource(layerName);
    if (source && source.type === "geojson") {
      const layerFeatures = this.viewer.featureStore.get(layerName);
      if (layerFeatures) {
        const featureCollection = {
          type: "FeatureCollection" as const,
          features: Array.from(layerFeatures.values()),
        };
        (source as import("maplibre-gl").GeoJSONSource).setData(featureCollection);
      }
    }
  }
}

/**
 * Create a MapLibreDataManager instance
 */
export function createMapLibreDataManager(
  viewer: ViewerWithConfigs,
): MapLibreDataManager {
  return new MapLibreDataManager(viewer);
}
