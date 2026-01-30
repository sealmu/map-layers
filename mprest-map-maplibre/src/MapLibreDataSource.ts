import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import type {
  IDataSource,
  EntityChangeCallback,
  IMapEntity,
  IEntityOptions,
} from "@mprest/map-core";
import type { FeatureCollection, Feature } from "geojson";
import type { MapLibreFeature } from "./types";
import { MapLibreMapEntity, toMapLibreFeature } from "./MapLibreMapEntity";

/**
 * MapLibre implementation of IDataSource
 * Wraps a GeoJSON source to provide provider-agnostic access
 */
export class MapLibreDataSource implements IDataSource {
  private map: MapLibreMap;
  private sourceName: string;
  private changeCallbacks: Set<EntityChangeCallback> = new Set();
  private features: Map<string, MapLibreFeature> = new Map();
  private _show: boolean = true;

  constructor(map: MapLibreMap, sourceName: string) {
    this.map = map;
    this.sourceName = sourceName;
  }

  get name(): string {
    return this.sourceName;
  }

  get show(): boolean {
    return this._show;
  }

  set show(value: boolean) {
    this._show = value;
    this.updateLayerVisibility(value);
  }

  get length(): number {
    return this.features.size;
  }

  add(options: IEntityOptions): IMapEntity {
    const feature = toMapLibreFeature(options);
    feature.layerId = this.sourceName;
    this.features.set(feature.id, feature);
    this.updateSource();

    const mapEntity = new MapLibreMapEntity(feature);
    this.notifyChange(mapEntity, "added");
    return mapEntity;
  }

  remove(entity: IMapEntity): boolean {
    const feature = entity.getNativeEntity<MapLibreFeature>();
    if (!this.features.has(feature.id)) return false;

    this.features.delete(feature.id);
    this.updateSource();
    this.notifyChange(entity, "removed");
    return true;
  }

  removeById(id: string): boolean {
    const feature = this.features.get(id);
    if (!feature) return false;

    this.features.delete(id);
    this.updateSource();

    const mapEntity = new MapLibreMapEntity(feature);
    this.notifyChange(mapEntity, "removed");
    return true;
  }

  removeAll(): void {
    this.features.clear();
    this.updateSource();
  }

  getById(id: string): IMapEntity | undefined {
    const feature = this.features.get(id);
    if (!feature) return undefined;
    return new MapLibreMapEntity(feature);
  }

  getAll(): IMapEntity[] {
    return Array.from(this.features.values()).map(
      (feature) => new MapLibreMapEntity(feature),
    );
  }

  onEntityChange(callback: EntityChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  getNativeDataSource<T = unknown>(): T {
    const source = this.map.getSource(this.sourceName);
    return source as unknown as T;
  }

  /**
   * Get all features as a GeoJSON FeatureCollection
   */
  getFeatureCollection(): FeatureCollection {
    return {
      type: "FeatureCollection",
      features: Array.from(this.features.values()) as Feature[],
    };
  }

  /**
   * Add a feature directly
   */
  addFeature(feature: MapLibreFeature): IMapEntity {
    feature.layerId = this.sourceName;
    this.features.set(feature.id, feature);
    this.updateSource();

    const mapEntity = new MapLibreMapEntity(feature);
    this.notifyChange(mapEntity, "added");
    return mapEntity;
  }

  /**
   * Get native feature by id
   */
  getFeature(id: string): MapLibreFeature | undefined {
    return this.features.get(id);
  }

  private updateSource(): void {
    const source = this.map.getSource(this.sourceName) as GeoJSONSource | undefined;
    if (source) {
      source.setData(this.getFeatureCollection());
    }
  }

  private updateLayerVisibility(visible: boolean): void {
    // Update visibility for all layers associated with this source
    const style = this.map.getStyle();
    if (!style || !style.layers) return;

    for (const layer of style.layers) {
      if ('source' in layer && layer.source === this.sourceName) {
        this.map.setLayoutProperty(
          layer.id,
          "visibility",
          visible ? "visible" : "none",
        );
      }
    }
  }

  private notifyChange(
    entity: IMapEntity,
    status: "added" | "removed" | "changed",
  ): void {
    for (const callback of this.changeCallbacks) {
      callback(entity, status);
    }
  }
}
