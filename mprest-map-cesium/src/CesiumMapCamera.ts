import {
  Viewer as CesiumViewer,
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  Rectangle,
  HeadingPitchRange,
  BoundingSphere,
} from "cesium";
import type {
  IMapCamera,
  IFlyToOptions,
  ICoordinate,
  IScreenPosition,
  ICameraOrientation,
  ICameraDestination,
  IBoundingBox,
} from "@mprest/map-core";
import { toCartesian3 } from "./adapters/coordinateAdapter";

/**
 * Cesium implementation of IMapCamera
 */
export class CesiumMapCamera implements IMapCamera {
  private viewer: CesiumViewer;

  constructor(viewer: CesiumViewer) {
    this.viewer = viewer;
  }

  // ============================================
  // State Accessors
  // ============================================

  getPosition(): ICoordinate {
    const cartographic = this.viewer.camera.positionCartographic;
    return {
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      height: cartographic.height,
    };
  }

  getOrientation(): ICameraOrientation {
    return {
      heading: this.viewer.camera.heading,
      pitch: this.viewer.camera.pitch,
      roll: this.viewer.camera.roll,
    };
  }

  // ============================================
  // Navigation
  // ============================================

  async flyTo(
    destination: ICameraDestination,
    options?: IFlyToOptions,
  ): Promise<void> {
    const target = toCartesian3(destination.position);

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: target,
        orientation: destination.orientation
          ? {
              heading: destination.orientation.heading,
              pitch: destination.orientation.pitch,
              roll: destination.orientation.roll,
            }
          : undefined,
        duration: options?.duration ?? 1.5,
        complete: () => resolve(),
        cancel: () => resolve(),
      });
    });
  }

  setView(destination: ICameraDestination): void {
    const target = toCartesian3(destination.position);

    this.viewer.camera.setView({
      destination: target,
      orientation: destination.orientation
        ? {
            heading: destination.orientation.heading,
            pitch: destination.orientation.pitch,
            roll: destination.orientation.roll,
          }
        : undefined,
    });
  }

  zoomIn(amount: number = 2): void {
    this.viewer.camera.zoomIn(
      this.viewer.camera.positionCartographic.height / amount,
    );
  }

  zoomOut(amount: number = 2): void {
    this.viewer.camera.zoomOut(
      this.viewer.camera.positionCartographic.height * (amount - 1),
    );
  }

  // ============================================
  // Bounds
  // ============================================

  async flyToBoundingBox(
    bounds: IBoundingBox,
    options?: IFlyToOptions,
  ): Promise<void> {
    const rectangle = Rectangle.fromDegrees(
      bounds.west,
      bounds.south,
      bounds.east,
      bounds.north,
    );

    return new Promise((resolve) => {
      this.viewer.camera.flyTo({
        destination: rectangle,
        duration: options?.duration ?? 1.5,
        complete: () => resolve(),
        cancel: () => resolve(),
      });
    });
  }

  // ============================================
  // Picking
  // ============================================

  pickPosition(screenPosition: IScreenPosition): ICoordinate | null {
    const cartesian = this.viewer.camera.pickEllipsoid(
      new Cartesian2(screenPosition.x, screenPosition.y),
      this.viewer.scene.globe.ellipsoid,
    );

    if (!cartesian) {
      return null;
    }

    const cartographic = Cartographic.fromCartesian(cartesian);
    return {
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      height: cartographic.height,
    };
  }

  // ============================================
  // Extended methods (Cesium-specific utilities)
  // ============================================

  /**
   * Fly to a coordinate with range offset
   */
  flyToLocation(
    coordinate: ICoordinate,
    options?: {
      heading?: number;
      pitch?: number;
      range?: number;
      duration?: number;
    },
  ): void {
    const target = toCartesian3(coordinate);
    const boundingSphere = new BoundingSphere(target, 0);
    const offset = new HeadingPitchRange(
      options?.heading ?? 0,
      options?.pitch ?? -45 * (Math.PI / 180),
      options?.range ?? 100000,
    );

    this.viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset,
      duration: options?.duration ?? 1.5,
    });
  }

  /**
   * Get the native Cesium camera
   */
  getNativeCamera(): CesiumViewer["camera"] {
    return this.viewer.camera;
  }
}

/**
 * Create a CesiumMapCamera instance from a viewer
 */
export function createCesiumMapCamera(viewer: CesiumViewer): IMapCamera {
  return new CesiumMapCamera(viewer);
}
