// App-specific types

export interface DroneAnimationConfig {
  droneId: string;
  centerLon: number;
  centerLat: number;
  radius: number;
  baseAlt: number;
  altAmp: number;
  segments: number;
  orbitDurationMs: number;
}
