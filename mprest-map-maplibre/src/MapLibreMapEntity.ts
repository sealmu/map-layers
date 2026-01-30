import type { IMapEntity, IEntityOptions, ICoordinate } from "@mprest/map-core";
import type { MapLibreFeature } from "./types";
import { toMapLibreColor } from "./adapters/colorAdapter";
import type { Point, Polygon, LineString, Position, GeoJsonProperties } from "geojson";

/**
 * MapLibre implementation of IMapEntity
 * Wraps a GeoJSON Feature to provide provider-agnostic access
 */
export class MapLibreMapEntity implements IMapEntity {
  private feature: MapLibreFeature;
  private properties: Record<string, unknown>;

  constructor(feature: MapLibreFeature) {
    this.feature = feature;
    this.properties = (feature.properties || {}) as Record<string, unknown>;
  }

  get id(): string {
    return this.feature.id;
  }

  get name(): string | undefined {
    return this.properties.name as string | undefined;
  }

  set name(value: string | undefined) {
    this.properties.name = value;
    if (this.feature.properties) {
      this.feature.properties.name = value;
    }
  }

  get show(): boolean {
    return this.properties.show !== false;
  }

  set show(value: boolean) {
    this.properties.show = value;
    if (this.feature.properties) {
      this.feature.properties.show = value;
    }
  }

  getPosition(): ICoordinate | undefined {
    const geometry = this.feature.geometry;
    if (!geometry) return undefined;

    let coords: Position;

    if (geometry.type === "Point") {
      coords = geometry.coordinates;
    } else if (geometry.type === "Polygon") {
      // Return centroid of first ring
      const ring = geometry.coordinates[0];
      if (!ring || ring.length === 0) return undefined;
      const sumLng = ring.reduce((acc, c) => acc + c[0], 0);
      const sumLat = ring.reduce((acc, c) => acc + c[1], 0);
      coords = [sumLng / ring.length, sumLat / ring.length];
    } else if (geometry.type === "LineString") {
      // Return first point
      coords = geometry.coordinates[0];
    } else {
      return undefined;
    }

    if (!coords) return undefined;

    return {
      longitude: coords[0],
      latitude: coords[1],
      height: coords[2] ?? 0,
    };
  }

  setPosition(position: ICoordinate): void {
    const geometry = this.feature.geometry;
    if (!geometry) return;

    if (geometry.type === "Point") {
      geometry.coordinates = [position.longitude, position.latitude, position.height ?? 0];
    }
    // For polygon/linestring, setting position is not straightforward
    // We would need to translate all coordinates
  }

  getProperty<T>(key: string): T | undefined {
    return this.properties[key] as T | undefined;
  }

  setProperty(key: string, value: unknown): void {
    this.properties[key] = value;
    if (this.feature.properties) {
      this.feature.properties[key] = value;
    }
  }

  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  getNativeEntity<T = unknown>(): T {
    return this.feature as unknown as T;
  }
}

/**
 * Convert IEntityOptions to MapLibre GeoJSON Feature
 */
export function toMapLibreFeature(
  options: IEntityOptions,
): MapLibreFeature {
  let geometry: Point | Polygon | LineString;
  const properties: GeoJsonProperties = {
    name: options.name,
    show: true,
  };

  // Determine geometry type based on options
  if (options.polygon && options.polygon.positions.length > 0) {
    const ring: Position[] = options.polygon.positions.map((p) => [
      p.longitude,
      p.latitude,
      p.height ?? 0,
    ]);
    // Close the ring if not already closed
    if (ring.length > 0) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
      }
    }
    geometry = { type: "Polygon", coordinates: [ring] };

    // Add polygon styling
    if (options.polygon.style) {
      properties.fillColor = options.polygon.style.fillColor
        ? toMapLibreColor(options.polygon.style.fillColor)
        : undefined;
      properties.fillOpacity = options.polygon.style.fillColor?.alpha ?? 0.5;
      properties.outlineColor = options.polygon.style.outlineColor
        ? toMapLibreColor(options.polygon.style.outlineColor)
        : undefined;
      properties.outlineWidth = options.polygon.style.outlineWidth;
    }
  } else if (options.polyline && options.polyline.positions.length > 0) {
    const coords: Position[] = options.polyline.positions.map((p) => [
      p.longitude,
      p.latitude,
      p.height ?? 0,
    ]);
    geometry = { type: "LineString", coordinates: coords };

    // Add polyline styling
    if (options.polyline.style) {
      properties.lineColor = toMapLibreColor(options.polyline.style.color);
      properties.lineWidth = options.polyline.style.width ?? 2;
    }
  } else if (options.position) {
    geometry = {
      type: "Point",
      coordinates: [
        options.position.longitude,
        options.position.latitude,
        options.position.height ?? 0,
      ],
    };

    // Add point styling
    if (options.point) {
      properties.pointColor = options.point.color
        ? toMapLibreColor(options.point.color)
        : undefined;
      properties.pointSize = options.point.pixelSize ?? 10;
      properties.outlineColor = options.point.outlineColor
        ? toMapLibreColor(options.point.outlineColor)
        : undefined;
      properties.outlineWidth = options.point.outlineWidth ?? 1;
    }

    // Add label
    if (options.label) {
      properties.labelText = options.label.text;
      properties.labelFont = options.label.font;
      properties.labelColor = options.label.fillColor
        ? toMapLibreColor(options.label.fillColor)
        : undefined;
      properties.labelScale = options.label.scale ?? 1;
    }

    // Add billboard
    if (options.billboard) {
      properties.iconImage = options.billboard.image;
      properties.iconScale = options.billboard.scale ?? 1;
      properties.iconRotation = options.billboard.rotation ?? 0;
    }
  } else {
    // Default to point at 0,0
    geometry = { type: "Point", coordinates: [0, 0, 0] };
  }

  // Copy additional properties
  if (options.properties) {
    Object.assign(properties, options.properties);
  }

  const feature: MapLibreFeature = {
    type: "Feature",
    id: options.id,
    geometry,
    properties,
  };

  return feature;
}

/**
 * Update a MapLibre Feature with partial IEntityOptions
 */
export function updateMapLibreFeature(
  feature: MapLibreFeature,
  updates: Partial<IEntityOptions>,
): void {
  if (updates.name !== undefined && feature.properties) {
    feature.properties.name = updates.name;
  }

  if (updates.position !== undefined && feature.geometry.type === "Point") {
    feature.geometry.coordinates = [
      updates.position.longitude,
      updates.position.latitude,
      updates.position.height ?? 0,
    ];
  }

  if (updates.point !== undefined && feature.properties) {
    if (updates.point.color) {
      feature.properties.pointColor = toMapLibreColor(updates.point.color);
    }
    if (updates.point.pixelSize !== undefined) {
      feature.properties.pointSize = updates.point.pixelSize;
    }
    if (updates.point.outlineColor) {
      feature.properties.outlineColor = toMapLibreColor(updates.point.outlineColor);
    }
    if (updates.point.outlineWidth !== undefined) {
      feature.properties.outlineWidth = updates.point.outlineWidth;
    }
  }

  if (updates.label !== undefined && feature.properties) {
    if (updates.label.text !== undefined) {
      feature.properties.labelText = updates.label.text;
    }
    if (updates.label.font !== undefined) {
      feature.properties.labelFont = updates.label.font;
    }
    if (updates.label.fillColor) {
      feature.properties.labelColor = toMapLibreColor(updates.label.fillColor);
    }
  }
}
