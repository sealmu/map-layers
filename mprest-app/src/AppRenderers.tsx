import {
  defaultRenderers,
  createPolylineEntity,
  type RendererRegistry,
  type LayerData,
} from "@mprest/map-cesium";
import { Cartesian3, Cartographic, ConstantProperty, PolygonHierarchy, ColorMaterialProperty, Color, type Entity } from "cesium";

export const AppRenderers = {
  ...defaultRenderers,
  polylines: createPolylineEntity,
  cone: createConeEntity,
} as const satisfies RendererRegistry;

function createConeEntity(item: LayerData): Entity.ConstructorOptions {
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
  let apex: Cartesian3;
  let coneAngleRadians: number;
  let range: number;

  if (config) {
    const [lon, lat, alt] = config.center;
    apex = Cartesian3.fromDegrees(lon, lat, alt);
    coneAngleRadians = config.coneAngle; // semi-angle
    range = config.radius; // max range/distance
  } else {
    // Fallback to defaults
    apex = item.positions[0];
    coneAngleRadians = Math.PI / 4; // 45 degrees semi-angle
    range = 1500000; // meters
  }

  const carto = Cartographic.fromCartesian(apex);
  const numSides = 2;

  // Create a cone that extends outward from the radar
  // For simplicity, let's create a triangular wedge
  const positions: Cartesian3[] = [apex];

  for (let i = 0; i < numSides; i++) {
    const angle = coneAngleRadians * (i * 2 - 1); // -coneAngleRadians to +coneAngleRadians
    // Calculate point at range distance
    const deltaLon = (range / 6371000) * Math.cos(angle) / Math.cos(carto.latitude);
    const deltaLat = (range / 6371000) * Math.sin(angle);
    const lon = carto.longitude + deltaLon;
    const lat = carto.latitude + deltaLat;
    const alt = 0; // Ground level for better visibility
    const pos = Cartesian3.fromRadians(lon, lat, alt);
    positions.push(pos);
  }
  // Close the polygon
  positions.push(apex);

  return {
    id: item.id,
    name: item.name,
    position: apex,
    point: {
      pixelSize: 10,
      color: Color.BLACK,
    },
    polygon: {
      hierarchy: new ConstantProperty(new PolygonHierarchy(positions)),
      material: new ColorMaterialProperty(new Color(1.0, 1.0, 0.0, 0.5)), // Semi-transparent yellow
      outline: true,
      outlineColor: item.color,
    },
  };
}