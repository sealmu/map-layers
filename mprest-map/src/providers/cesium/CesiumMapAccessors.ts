import {
  Viewer as CesiumViewer,
  HeadingPitchRange,
  type Entity,
} from "cesium";
import type {
  IMapAccessors,
  IEntityMetadata,
  ILayerMetadata,
} from "../../types/core/interfaces/IMapAccessors";
import type { ICoordinate, ICameraOrientation } from "../../types/core/types/coordinates";
import { CesiumMapCamera } from "./CesiumMapCamera";

/**
 * Cesium implementation of IMapAccessors
 * Uses composition with CesiumMapCamera for camera operations
 */
export class CesiumMapAccessors implements IMapAccessors {
  private viewer: CesiumViewer;

  /** Camera control interface */
  readonly camera: CesiumMapCamera;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
    this.camera = new CesiumMapCamera(viewer);
  }

  getLayerNames(): string[] {
    const names: string[] = [];
    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      if (ds.name) {
        names.push(ds.name);
      }
    }
    return names;
  }

  getLayerMetadata(layerName: string): ILayerMetadata | null {
    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      if (ds.name === layerName) {
        return {
          name: ds.name,
          show: ds.show,
          entityCount: ds.entities.values.length,
        };
      }
    }
    return null;
  }

  getLayerEntities(layerName: string): IEntityMetadata[] {
    const entities: IEntityMetadata[] = [];

    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      if (ds.name === layerName) {
        ds.entities.values.forEach((entity) => {
          entities.push({
            id: entity.id,
            name: entity.name || entity.id,
            layerId: entity.properties?.layerId?.getValue?.() ?? layerName,
            renderType: entity.properties?.rendererType?.getValue?.(),
            show: entity.show,
          });
        });
        break;
      }
    }

    return entities;
  }

  findEntityById(id: string, layerName?: string): IEntityMetadata | null {
    // Search in specific layer
    if (layerName) {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const ds = this.viewer.dataSources.get(i);
        if (ds.name === layerName) {
          const entity = ds.entities.getById(id);
          if (entity) {
            return {
              id: entity.id,
              name: entity.name || entity.id,
              layerId: entity.properties?.layerId?.getValue?.() ?? layerName,
              renderType: entity.properties?.rendererType?.getValue?.(),
              show: entity.show,
            };
          }
          break;
        }
      }
      return null;
    }

    // Search all layers
    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      const entity = ds.entities.getById(id);
      if (entity) {
        return {
          id: entity.id,
          name: entity.name || entity.id,
          layerId: entity.properties?.layerId?.getValue?.() ?? ds.name,
          renderType: entity.properties?.rendererType?.getValue?.(),
          show: entity.show,
        };
      }
    }

    // Also check default entities
    const defaultEntity = this.viewer.entities.getById(id);
    if (defaultEntity) {
      return {
        id: defaultEntity.id,
        name: defaultEntity.name || defaultEntity.id,
        layerId: "__default__",
        renderType: defaultEntity.properties?.rendererType?.getValue?.(),
        show: defaultEntity.show,
      };
    }

    return null;
  }

  setEntityVisibility(id: string, visible: boolean, layerName?: string): boolean {
    // Search in specific layer
    if (layerName) {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const ds = this.viewer.dataSources.get(i);
        if (ds.name === layerName) {
          const entity = ds.entities.getById(id);
          if (entity) {
            entity.show = visible;
            return true;
          }
          break;
        }
      }
      return false;
    }

    // Search all layers
    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      const entity = ds.entities.getById(id);
      if (entity) {
        entity.show = visible;
        return true;
      }
    }

    // Also check default entities
    const defaultEntity = this.viewer.entities.getById(id);
    if (defaultEntity) {
      defaultEntity.show = visible;
      return true;
    }

    return false;
  }

  getNativeEntity<T = unknown>(id: string, layerName?: string): T | null {
    // Search in specific layer
    if (layerName) {
      for (let i = 0; i < this.viewer.dataSources.length; i++) {
        const ds = this.viewer.dataSources.get(i);
        if (ds.name === layerName) {
          const entity = ds.entities.getById(id);
          if (entity) {
            return entity as unknown as T;
          }
          break;
        }
      }
      return null;
    }

    // Search all layers
    for (let i = 0; i < this.viewer.dataSources.length; i++) {
      const ds = this.viewer.dataSources.get(i);
      const entity = ds.entities.getById(id);
      if (entity) {
        return entity as unknown as T;
      }
    }

    // Also check default entities
    const defaultEntity = this.viewer.entities.getById(id);
    if (defaultEntity) {
      return defaultEntity as unknown as T;
    }

    return null;
  }

  selectEntity(id: string, layerName?: string): boolean {
    const entity = this.getNativeEntity(id, layerName);
    if (entity) {
      this.viewer.selectedEntity = entity as unknown as CesiumViewer["selectedEntity"];
      return true;
    }
    return false;
  }

  getSelectedEntityId(): string | null {
    return this.viewer.selectedEntity?.id ?? null;
  }

  async flyToEntity(
    id: string,
    options?: {
      layerName?: string;
      range?: number;
      duration?: number;
    },
  ): Promise<void> {
    const entity = this.getNativeEntity<Entity>(id, options?.layerName);
    if (!entity) {
      return;
    }

    if (options?.range !== undefined) {
      const currentHeading = this.viewer.camera.heading;
      const currentPitch = this.viewer.camera.pitch;

      await this.viewer.flyTo(entity, {
        duration: options.duration ?? 1.5,
        offset: new HeadingPitchRange(currentHeading, currentPitch, options.range),
      });
    } else {
      await this.viewer.flyTo(entity, {
        duration: options?.duration ?? 1.5,
      });
    }
  }

  // ============================================
  // Camera methods (delegated to CesiumMapCamera)
  // ============================================

  getCameraPosition(): ICoordinate {
    return this.camera.getPosition();
  }

  getCameraOrientation(): ICameraOrientation {
    return this.camera.getOrientation();
  }

  flyToLocation(
    coordinate: ICoordinate,
    options?: {
      heading?: number;
      pitch?: number;
      range?: number;
      duration?: number;
    },
  ): void {
    this.camera.flyToLocation(coordinate, options);
  }
}

/**
 * Create a CesiumMapAccessors instance from a viewer
 */
export function createCesiumMapAccessors(viewer: CesiumViewer): CesiumMapAccessors {
  return new CesiumMapAccessors(viewer);
}
