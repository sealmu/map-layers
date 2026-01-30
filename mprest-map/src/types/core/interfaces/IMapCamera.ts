import type {
  ICoordinate,
  IScreenPosition,
  ICameraOrientation,
  ICameraDestination,
  IBoundingBox,
} from "../types/coordinates";

/**
 * Fly-to animation options
 */
export interface IFlyToOptions {
  /** Animation duration in seconds */
  duration?: number;
  /** Easing function (if supported by provider) */
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
}

/**
 * Provider-agnostic camera interface
 */
export interface IMapCamera {
  // ============================================
  // State Accessors
  // ============================================

  /**
   * Get current camera position
   */
  getPosition(): ICoordinate;

  /**
   * Get current camera orientation
   */
  getOrientation(): ICameraOrientation;

  // ============================================
  // Navigation
  // ============================================

  /**
   * Fly to a destination with animation
   */
  flyTo(destination: ICameraDestination, options?: IFlyToOptions): Promise<void>;

  /**
   * Set camera view immediately (no animation)
   */
  setView(destination: ICameraDestination): void;

  /**
   * Zoom in by a factor
   */
  zoomIn(amount?: number): void;

  /**
   * Zoom out by a factor
   */
  zoomOut(amount?: number): void;

  // ============================================
  // Bounds
  // ============================================

  /**
   * Fly to show a bounding box
   */
  flyToBoundingBox(bounds: IBoundingBox, options?: IFlyToOptions): Promise<void>;

  // ============================================
  // Picking
  // ============================================

  /**
   * Get geographic coordinate from screen position
   */
  pickPosition(screenPosition: IScreenPosition): ICoordinate | null;
}
