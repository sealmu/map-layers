import type { ICoordinate } from "../types/coordinates";
import type {
  IPointStyle,
  ILabelStyle,
  IPolylineStyle,
  IPolygonStyle,
  IBillboardStyle,
  IModelStyle,
  IEllipseStyle,
} from "../types/graphics";

/**
 * Entity change status
 */
export type EntityChangeStatus = "added" | "removed" | "changed";

/**
 * Provider-agnostic entity options for creation/update
 */
export interface IEntityOptions {
  id: string;
  name?: string;
  description?: string;
  show?: boolean;

  /** Position for point-based entities */
  position?: ICoordinate;

  /** Point graphics (mutually exclusive with other graphics) */
  point?: IPointStyle;

  /** Label graphics */
  label?: ILabelStyle;

  /** Polyline graphics with positions */
  polyline?: {
    positions: ICoordinate[];
    style: IPolylineStyle;
  };

  /** Polygon graphics with positions */
  polygon?: {
    positions: ICoordinate[];
    style: IPolygonStyle;
  };

  /** Billboard (image marker) graphics */
  billboard?: IBillboardStyle;

  /** 3D Model graphics */
  model?: IModelStyle;

  /** Ellipse/dome graphics */
  ellipse?: IEllipseStyle;

  /** Custom properties storage */
  properties?: Record<string, unknown>;
}

/**
 * Provider-agnostic entity interface
 */
export interface IMapEntity {
  /** Unique entity identifier */
  readonly id: string;

  /** Entity display name */
  name: string | undefined;

  /** Visibility flag */
  show: boolean;

  /** Get current position */
  getPosition(): ICoordinate | undefined;

  /** Update position */
  setPosition(position: ICoordinate): void;

  /** Get a custom property value */
  getProperty<T = unknown>(key: string): T | undefined;

  /** Set a custom property value */
  setProperty(key: string, value: unknown): void;

  /** Get all custom properties */
  getProperties(): Record<string, unknown>;

  /** Access the native entity (Cesium.Entity, L.Marker, etc.) */
  getNativeEntity<T = unknown>(): T;
}
