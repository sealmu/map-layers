export type MyDataPayload = {
  x: number;
  y: number;
  z?: number;
  shape?: string;
  config?: {
    center: [number, number, number];
    radius: number;
    angle: number;
  };
};

export type LngLat = [number, number];
export type LngLatAlt = [number, number, number];

export type MapLibreColor = string; // hex color string like "#FF0000"
