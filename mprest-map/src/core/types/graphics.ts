import type { IScreenPosition } from "./coordinates";

/**
 * RGBA color with values in 0-1 range
 */
export interface IColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * Helper for creating and manipulating colors
 */
export const Colors = {
  RED: { red: 1, green: 0, blue: 0, alpha: 1 } as IColor,
  GREEN: { red: 0, green: 1, blue: 0, alpha: 1 } as IColor,
  BLUE: { red: 0, green: 0, blue: 1, alpha: 1 } as IColor,
  YELLOW: { red: 1, green: 1, blue: 0, alpha: 1 } as IColor,
  CYAN: { red: 0, green: 1, blue: 1, alpha: 1 } as IColor,
  MAGENTA: { red: 1, green: 0, blue: 1, alpha: 1 } as IColor,
  WHITE: { red: 1, green: 1, blue: 1, alpha: 1 } as IColor,
  BLACK: { red: 0, green: 0, blue: 0, alpha: 1 } as IColor,
  GRAY: { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 } as IColor,
  TRANSPARENT: { red: 0, green: 0, blue: 0, alpha: 0 } as IColor,

  /**
   * Create a color with modified alpha
   */
  withAlpha: (color: IColor, alpha: number): IColor => ({
    ...color,
    alpha,
  }),

  /**
   * Create a color from RGB values (0-255 range)
   */
  fromRgb: (r: number, g: number, b: number, a: number = 1): IColor => ({
    red: r / 255,
    green: g / 255,
    blue: b / 255,
    alpha: a,
  }),

  /**
   * Create a color from a hex string (#RRGGBB or #RRGGBBAA)
   */
  fromHex: (hex: string): IColor => {
    const cleaned = hex.replace("#", "");
    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    const a = cleaned.length === 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : 1;
    return { red: r, green: g, blue: b, alpha: a };
  },
} as const;

/**
 * Point rendering style
 */
export interface IPointStyle {
  pixelSize: number;
  color: IColor;
  outlineColor?: IColor;
  outlineWidth?: number;
}

/**
 * Label rendering style
 */
export interface ILabelStyle {
  text: string;
  font?: string;
  fillColor?: IColor;
  outlineColor?: IColor;
  outlineWidth?: number;
  pixelOffset?: IScreenPosition;
  scale?: number;
  showBackground?: boolean;
  backgroundColor?: IColor;
}

/**
 * Polyline rendering style
 */
export interface IPolylineStyle {
  width: number;
  color: IColor;
  dashed?: boolean;
  dashLength?: number;
}

/**
 * Polygon rendering style
 */
export interface IPolygonStyle {
  fillColor?: IColor;
  outline?: boolean;
  outlineColor?: IColor;
  outlineWidth?: number;
}

/**
 * Billboard (image marker) style
 */
export interface IBillboardStyle {
  image: string;
  scale?: number;
  color?: IColor;
  pixelOffset?: IScreenPosition;
  rotation?: number;
  width?: number;
  height?: number;
}

/**
 * 3D Model style
 */
export interface IModelStyle {
  uri: string;
  scale?: number;
  minimumPixelSize?: number;
  maximumScale?: number;
}

/**
 * Ellipse/dome style
 */
export interface IEllipseStyle {
  semiMajorAxis: number;
  semiMinorAxis: number;
  rotation?: number;
  fillColor?: IColor;
  outline?: boolean;
  outlineColor?: IColor;
  outlineWidth?: number;
  height?: number;
  extrudedHeight?: number;
}
