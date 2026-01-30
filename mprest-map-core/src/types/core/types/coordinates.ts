/**
 * Geographic coordinate in degrees (WGS84)
 */
export interface ICoordinate {
  /** Latitude in degrees (-90 to 90) */
  latitude: number;
  /** Longitude in degrees (-180 to 180) */
  longitude: number;
  /** Height in meters above the ellipsoid (optional) */
  height?: number;
}

/**
 * 3D cartesian position (for internal calculations)
 */
export interface ICartesian3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D screen/canvas position in pixels
 */
export interface IScreenPosition {
  x: number;
  y: number;
}

/**
 * Bounding box in geographic coordinates
 */
export interface IBoundingBox {
  /** Western boundary in degrees */
  west: number;
  /** Southern boundary in degrees */
  south: number;
  /** Eastern boundary in degrees */
  east: number;
  /** Northern boundary in degrees */
  north: number;
}

/**
 * Camera orientation angles
 */
export interface ICameraOrientation {
  /** Heading in radians (0 = north, positive = clockwise) */
  heading: number;
  /** Pitch in radians (negative = looking down) */
  pitch: number;
  /** Roll in radians */
  roll: number;
}

/**
 * Camera destination for flyTo operations
 */
export interface ICameraDestination {
  position: ICoordinate;
  orientation?: ICameraOrientation;
}
