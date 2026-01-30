import type { DataSource, Entity } from "cesium";
import type {
  IDataSource,
  EntityChangeCallback,
} from "../../types/core/interfaces/IDataSource";
import type { IMapEntity, IEntityOptions } from "../../types/core/interfaces/IMapEntity";
import { CesiumMapEntity, toCesiumEntityOptions } from "./CesiumMapEntity";

/**
 * Cesium implementation of IDataSource
 * Wraps a Cesium DataSource to provide provider-agnostic access
 */
export class CesiumDataSource implements IDataSource {
  private dataSource: DataSource;
  private changeCallbacks: Set<EntityChangeCallback> = new Set();

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  get name(): string {
    return this.dataSource.name;
  }

  get show(): boolean {
    return this.dataSource.show;
  }

  set show(value: boolean) {
    this.dataSource.show = value;
  }

  get length(): number {
    return this.dataSource.entities.values.length;
  }

  add(options: IEntityOptions): IMapEntity {
    const cesiumOptions = toCesiumEntityOptions(options);
    const entity = this.dataSource.entities.add(cesiumOptions);
    const mapEntity = new CesiumMapEntity(entity);
    this.notifyChange(mapEntity, "added");
    return mapEntity;
  }

  remove(entity: IMapEntity): boolean {
    const nativeEntity = entity.getNativeEntity<Entity>();
    const result = this.dataSource.entities.remove(nativeEntity);
    if (result) {
      this.notifyChange(entity, "removed");
    }
    return result;
  }

  removeById(id: string): boolean {
    const entity = this.dataSource.entities.getById(id);
    if (!entity) return false;
    const mapEntity = new CesiumMapEntity(entity);
    const result = this.dataSource.entities.removeById(id);
    if (result) {
      this.notifyChange(mapEntity, "removed");
    }
    return result;
  }

  removeAll(): void {
    this.dataSource.entities.removeAll();
  }

  getById(id: string): IMapEntity | undefined {
    const entity = this.dataSource.entities.getById(id);
    if (!entity) return undefined;
    return new CesiumMapEntity(entity);
  }

  getAll(): IMapEntity[] {
    return this.dataSource.entities.values.map(
      (entity) => new CesiumMapEntity(entity),
    );
  }

  onEntityChange(callback: EntityChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  getNativeDataSource<T = unknown>(): T {
    return this.dataSource as unknown as T;
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
