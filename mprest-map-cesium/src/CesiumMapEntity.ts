import {
  Entity,
  ConstantPositionProperty,
  PointGraphics,
  LabelGraphics,
  BillboardGraphics,
  PolylineGraphics,
  PolygonGraphics,
  ModelGraphics,
  EllipseGraphics,
  PropertyBag,
  JulianDate,
} from "cesium";
import type { IMapEntity, IEntityOptions, ICoordinate } from "@mprest/map-core";
import { toCoordinate, toCartesian3 } from "./adapters/coordinateAdapter";
import { toCesiumColor } from "./adapters/colorAdapter";

/**
 * Cesium implementation of IMapEntity
 * Wraps a Cesium Entity to provide provider-agnostic access
 */
export class CesiumMapEntity implements IMapEntity {
  private entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
  }

  get id(): string {
    return this.entity.id;
  }

  get name(): string | undefined {
    return this.entity.name;
  }

  set name(value: string | undefined) {
    this.entity.name = value;
  }

  get show(): boolean {
    return this.entity.show;
  }

  set show(value: boolean) {
    this.entity.show = value;
  }

  getPosition(): ICoordinate | undefined {
    const position = this.entity.position;
    if (!position) return undefined;

    try {
      const cartesian = position.getValue(JulianDate.now());
      if (!cartesian) return undefined;
      return toCoordinate(cartesian);
    } catch {
      return undefined;
    }
  }

  setPosition(position: ICoordinate): void {
    const cartesian = toCartesian3(position);
    this.entity.position = new ConstantPositionProperty(cartesian);
  }

  getProperty<T>(key: string): T | undefined {
    if (!this.entity.properties) return undefined;
    const prop = this.entity.properties[key];
    if (prop && typeof prop.getValue === "function") {
      return prop.getValue(JulianDate.now()) as T;
    }
    return prop as T | undefined;
  }

  setProperty(key: string, value: unknown): void {
    if (!this.entity.properties) {
      this.entity.properties = new PropertyBag() as Entity["properties"];
    }
    if (this.entity.properties) {
      this.entity.properties.addProperty(key, value);
    }
  }

  getProperties(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (!this.entity.properties) return result;

    const propertyNames = this.entity.properties.propertyNames;
    for (const name of propertyNames) {
      const prop = this.entity.properties[name];
      if (prop && typeof prop.getValue === "function") {
        result[name] = prop.getValue(JulianDate.now());
      } else {
        result[name] = prop;
      }
    }
    return result;
  }

  getNativeEntity<T = unknown>(): T {
    return this.entity as unknown as T;
  }
}

/**
 * Convert IEntityOptions to Cesium Entity.ConstructorOptions
 */
export function toCesiumEntityOptions(
  options: IEntityOptions,
): Entity.ConstructorOptions {
  const cesiumOptions: Entity.ConstructorOptions = {
    id: options.id,
    name: options.name,
  };

  // Position
  if (options.position) {
    cesiumOptions.position = new ConstantPositionProperty(
      toCartesian3(options.position),
    );
  }

  // Point
  if (options.point) {
    cesiumOptions.point = new PointGraphics({
      pixelSize: options.point.pixelSize,
      color: toCesiumColor(options.point.color),
      outlineColor: options.point.outlineColor
        ? toCesiumColor(options.point.outlineColor)
        : undefined,
      outlineWidth: options.point.outlineWidth,
    });
  }

  // Label
  if (options.label) {
    cesiumOptions.label = new LabelGraphics({
      text: options.label.text,
      font: options.label.font,
      fillColor: options.label.fillColor
        ? toCesiumColor(options.label.fillColor)
        : undefined,
      outlineColor: options.label.outlineColor
        ? toCesiumColor(options.label.outlineColor)
        : undefined,
      outlineWidth: options.label.outlineWidth,
      scale: options.label.scale,
      showBackground: options.label.showBackground,
      backgroundColor: options.label.backgroundColor
        ? toCesiumColor(options.label.backgroundColor)
        : undefined,
    });
  }

  // Billboard
  if (options.billboard) {
    cesiumOptions.billboard = new BillboardGraphics({
      image: options.billboard.image,
      scale: options.billboard.scale,
      color: options.billboard.color
        ? toCesiumColor(options.billboard.color)
        : undefined,
      rotation: options.billboard.rotation,
      width: options.billboard.width,
      height: options.billboard.height,
    });
  }

  // Polyline
  if (options.polyline) {
    const positions = options.polyline.positions.map(toCartesian3);
    cesiumOptions.polyline = new PolylineGraphics({
      positions,
      width: options.polyline.style.width,
      material: toCesiumColor(options.polyline.style.color),
    });
  }

  // Polygon
  if (options.polygon) {
    const positions = options.polygon.positions.map(toCartesian3);
    cesiumOptions.polygon = new PolygonGraphics({
      hierarchy: positions,
      material: options.polygon.style.fillColor
        ? toCesiumColor(options.polygon.style.fillColor)
        : undefined,
      outline: options.polygon.style.outline,
      outlineColor: options.polygon.style.outlineColor
        ? toCesiumColor(options.polygon.style.outlineColor)
        : undefined,
      outlineWidth: options.polygon.style.outlineWidth,
    });
  }

  // Model
  if (options.model) {
    cesiumOptions.model = new ModelGraphics({
      uri: options.model.uri,
      scale: options.model.scale,
      minimumPixelSize: options.model.minimumPixelSize,
      maximumScale: options.model.maximumScale,
    });
  }

  // Ellipse
  if (options.ellipse) {
    cesiumOptions.ellipse = new EllipseGraphics({
      semiMajorAxis: options.ellipse.semiMajorAxis,
      semiMinorAxis: options.ellipse.semiMinorAxis,
      rotation: options.ellipse.rotation,
      material: options.ellipse.fillColor
        ? toCesiumColor(options.ellipse.fillColor)
        : undefined,
      outline: options.ellipse.outline,
      outlineColor: options.ellipse.outlineColor
        ? toCesiumColor(options.ellipse.outlineColor)
        : undefined,
      outlineWidth: options.ellipse.outlineWidth,
    });
  }

  // Properties
  if (options.properties) {
    const props = new PropertyBag();
    for (const [key, value] of Object.entries(options.properties)) {
      props.addProperty(key, value);
    }
    cesiumOptions.properties = props;
  }

  return cesiumOptions;
}

/**
 * Update a Cesium Entity with partial IEntityOptions
 */
export function updateCesiumEntity(
  entity: Entity,
  updates: Partial<IEntityOptions>,
): void {
  if (updates.name !== undefined) {
    entity.name = updates.name;
  }

  if (updates.position !== undefined) {
    entity.position = new ConstantPositionProperty(
      toCartesian3(updates.position),
    );
  }

  if (updates.point !== undefined) {
    entity.point = new PointGraphics({
      pixelSize: updates.point.pixelSize,
      color: toCesiumColor(updates.point.color),
      outlineColor: updates.point.outlineColor
        ? toCesiumColor(updates.point.outlineColor)
        : undefined,
      outlineWidth: updates.point.outlineWidth,
    });
  }

  if (updates.label !== undefined) {
    entity.label = new LabelGraphics({
      text: updates.label.text,
      font: updates.label.font,
      fillColor: updates.label.fillColor
        ? toCesiumColor(updates.label.fillColor)
        : undefined,
      outlineColor: updates.label.outlineColor
        ? toCesiumColor(updates.label.outlineColor)
        : undefined,
      outlineWidth: updates.label.outlineWidth,
      scale: updates.label.scale,
    });
  }

  if (updates.billboard !== undefined) {
    entity.billboard = new BillboardGraphics({
      image: updates.billboard.image,
      scale: updates.billboard.scale,
      color: updates.billboard.color
        ? toCesiumColor(updates.billboard.color)
        : undefined,
      rotation: updates.billboard.rotation,
      width: updates.billboard.width,
      height: updates.billboard.height,
    });
  }

  if (updates.polyline !== undefined) {
    const positions = updates.polyline.positions.map(toCartesian3);
    entity.polyline = new PolylineGraphics({
      positions,
      width: updates.polyline.style.width,
      material: toCesiumColor(updates.polyline.style.color),
    });
  }

  if (updates.polygon !== undefined) {
    const positions = updates.polygon.positions.map(toCartesian3);
    entity.polygon = new PolygonGraphics({
      hierarchy: positions,
      material: updates.polygon.style.fillColor
        ? toCesiumColor(updates.polygon.style.fillColor)
        : undefined,
      outline: updates.polygon.style.outline,
      outlineColor: updates.polygon.style.outlineColor
        ? toCesiumColor(updates.polygon.style.outlineColor)
        : undefined,
      outlineWidth: updates.polygon.style.outlineWidth,
    });
  }

  if (updates.model !== undefined) {
    entity.model = new ModelGraphics({
      uri: updates.model.uri,
      scale: updates.model.scale,
      minimumPixelSize: updates.model.minimumPixelSize,
      maximumScale: updates.model.maximumScale,
    });
  }

  if (updates.ellipse !== undefined) {
    entity.ellipse = new EllipseGraphics({
      semiMajorAxis: updates.ellipse.semiMajorAxis,
      semiMinorAxis: updates.ellipse.semiMinorAxis,
      rotation: updates.ellipse.rotation,
      material: updates.ellipse.fillColor
        ? toCesiumColor(updates.ellipse.fillColor)
        : undefined,
      outline: updates.ellipse.outline,
      outlineColor: updates.ellipse.outlineColor
        ? toCesiumColor(updates.ellipse.outlineColor)
        : undefined,
      outlineWidth: updates.ellipse.outlineWidth,
    });
  }
}
