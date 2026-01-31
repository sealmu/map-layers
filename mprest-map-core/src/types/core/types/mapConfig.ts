/**
 * Provider-agnostic map configuration
 */

/**
 * Geographic center coordinates
 */
export interface IMapCenter {
  /** Longitude in degrees */
  longitude: number;
  /** Latitude in degrees */
  latitude: number;
  /** Height/altitude in meters (optional) */
  height?: number;
}

/**
 * Camera/view orientation
 */
export interface IMapOrientation {
  /** Heading in degrees (0 = north, 90 = east) */
  heading?: number;
  /** Pitch in degrees (-90 = down, 0 = horizon, 90 = up) */
  pitch?: number;
  /** Roll in degrees */
  roll?: number;
}

/**
 * Map configuration for initial setup
 */
export interface IMapConfig {
  /** Initial center coordinates */
  center?: IMapCenter;
  /** Initial zoom level (provider-specific interpretation) */
  zoom?: number;
  /** Initial camera orientation */
  orientation?: IMapOrientation;
  /** Duration for initial camera animation in seconds (0 = instant) */
  animationDuration?: number;
}
