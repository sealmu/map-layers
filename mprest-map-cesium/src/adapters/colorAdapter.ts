import { Color as CesiumColor } from "cesium";
import type { IColor } from "@mprest/map-core";

/**
 * Convert IColor to Cesium Color
 */
export function toCesiumColor(color: IColor): CesiumColor {
  return new CesiumColor(color.red, color.green, color.blue, color.alpha);
}

/**
 * Convert Cesium Color to IColor
 */
export function fromCesiumColor(color: CesiumColor): IColor {
  return {
    red: color.red,
    green: color.green,
    blue: color.blue,
    alpha: color.alpha,
  };
}

/**
 * Convert IColor to Cesium Color with modified alpha
 */
export function toCesiumColorWithAlpha(color: IColor, alpha: number): CesiumColor {
  return new CesiumColor(color.red, color.green, color.blue, alpha);
}
