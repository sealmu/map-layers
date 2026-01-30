import type { IColor } from "@mprest/map-core";

/**
 * Convert IColor to MapLibre rgba string
 */
export function toMapLibreColor(color: IColor): string {
  const r = Math.round(color.red * 255);
  const g = Math.round(color.green * 255);
  const b = Math.round(color.blue * 255);
  const a = color.alpha;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert IColor to hex string (without alpha)
 */
export function toHexColor(color: IColor): string {
  const r = Math.round(color.red * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.green * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.blue * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Parse rgba string to IColor
 */
export function fromRgbaString(rgba: string): IColor {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return { red: 1, green: 1, blue: 1, alpha: 1 };
  }
  return {
    red: parseInt(match[1], 10) / 255,
    green: parseInt(match[2], 10) / 255,
    blue: parseInt(match[3], 10) / 255,
    alpha: match[4] ? parseFloat(match[4]) : 1,
  };
}

/**
 * Parse hex color string to IColor
 */
export function fromHexColor(hex: string): IColor {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return {
    red: r,
    green: g,
    blue: b,
    alpha: 1,
  };
}

/**
 * Create an IColor from RGBA values (0-255 range)
 */
export function createColor(r: number, g: number, b: number, a: number = 255): IColor {
  return {
    red: r / 255,
    green: g / 255,
    blue: b / 255,
    alpha: a / 255,
  };
}
