import {
  defaultRenderers,
  createPolylineFeature,
  toMapLibreColor,
  type RendererRegistry,
  type LayerData,
  type MapLibreFeature,
} from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const AppRenderers = {
  ...defaultRenderers,
  polylines: createPolylineFeature,
  cone: createConeFeature,
  domes: createDomeFeature,
} as const satisfies RendererRegistry;

function createConeFeature(item: LayerData): MapLibreFeature {
  type ConeItemData = {
    data?: {
      config?: {
        center: [number, number, number];
        radius: number;
        coneAngle: number;
      };
    };
  };

  const config = (item as ConeItemData).data?.config;
  let centerLng: number;
  let centerLat: number;
  let coneAngleRadians: number;
  let range: number;

  if (config) {
    [centerLng, centerLat] = config.center;
    coneAngleRadians = config.coneAngle; // semi-angle
    range = config.radius; // max range/distance in meters
  } else {
    // Fallback to defaults
    const pos = item.positions[0];
    centerLng = pos.longitude;
    centerLat = pos.latitude;
    coneAngleRadians = Math.PI / 4; // 45 degrees semi-angle
    range = 1500000; // meters
  }

  // Convert meters to degrees (approximate)
  const metersToDegreesLat = range / 111320;
  const metersToDegreesLng = range / (111320 * Math.cos(centerLat * Math.PI / 180));

  // Create a cone/wedge shape as a polygon
  const numSides = 2;
  const positions: [number, number][] = [[centerLng, centerLat]]; // apex

  for (let i = 0; i < numSides; i++) {
    const angle = coneAngleRadians * (i * 2 - 1); // -coneAngleRadians to +coneAngleRadians
    const deltaLng = metersToDegreesLng * Math.cos(angle);
    const deltaLat = metersToDegreesLat * Math.sin(angle);
    const lng = centerLng + deltaLng;
    const lat = centerLat + deltaLat;
    positions.push([lng, lat]);
  }
  // Close the polygon
  positions.push([centerLng, centerLat]);

  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Polygon",
      coordinates: [positions],
    },
    properties: {
      id: item.id,
      name: item.name,
      fillColor: toMapLibreColor(Colors.withAlpha(item.color, 0.5)),
      fillOpacity: 0.5,
      outlineColor: toMapLibreColor(item.color),
      outlineWidth: 2,
      rendererType: "cone",
      show: true,
    },
  };
}

function createDomeFeature(item: LayerData): MapLibreFeature {
  type DomeItemData = {
    data?: {
      config?: {
        center: [number, number, number];
        radius: number;
        angle: number;
      };
    };
  };

  const config = (item as DomeItemData).data?.config;
  let centerLng: number;
  let centerLat: number;
  let radius: number;

  if (config) {
    [centerLng, centerLat] = config.center;
    radius = config.radius;
  } else {
    const pos = item.positions[0];
    centerLng = pos.longitude;
    centerLat = pos.latitude;
    radius = 100000; // default 100km
  }

  // Create a circle approximation with multiple points
  const numPoints = 64;
  const positions: [number, number][] = [];

  // Convert meters to degrees (approximate)
  const metersToDegreesLat = radius / 111320;
  const metersToDegreesLng = radius / (111320 * Math.cos(centerLat * Math.PI / 180));

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lng = centerLng + metersToDegreesLng * Math.cos(angle);
    const lat = centerLat + metersToDegreesLat * Math.sin(angle);
    positions.push([lng, lat]);
  }

  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Polygon",
      coordinates: [positions],
    },
    properties: {
      id: item.id,
      name: item.name,
      fillColor: toMapLibreColor(Colors.withAlpha(item.color, 0.3)),
      fillOpacity: 0.3,
      outlineColor: toMapLibreColor(item.color),
      outlineWidth: 2,
      rendererType: "domes",
      show: true,
    },
  };
}
