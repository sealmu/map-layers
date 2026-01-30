import type { Entity } from "cesium";
import {
  PointGraphics,
  LabelGraphics,
  BillboardGraphics,
  PolylineGraphics,
  PolygonGraphics,
  ModelGraphics,
  EllipseGraphics,
  HeightReference,
  PolygonHierarchy,
  VerticalOrigin,
  LabelStyle,
} from "cesium";
import type { IEntityOptions } from "@mprest/map-core";
import { toCartesian3, toCartesian3Array, toCartesian2 } from "./coordinateAdapter";
import { toCesiumColor } from "./colorAdapter";

/**
 * Convert IEntityOptions to Cesium Entity.ConstructorOptions
 */
export function toCesiumEntityOptions(options: IEntityOptions): Entity.ConstructorOptions {
  const cesiumOptions: Entity.ConstructorOptions = {
    id: options.id,
    name: options.name,
    description: options.description,
    show: options.show ?? true,
  };

  // Position
  if (options.position) {
    cesiumOptions.position = toCartesian3(options.position);
  }

  // Point graphics
  if (options.point) {
    cesiumOptions.point = new PointGraphics({
      pixelSize: options.point.pixelSize,
      color: toCesiumColor(options.point.color),
      outlineColor: options.point.outlineColor
        ? toCesiumColor(options.point.outlineColor)
        : undefined,
      outlineWidth: options.point.outlineWidth,
      heightReference: HeightReference.CLAMP_TO_GROUND,
    });
  }

  // Label graphics
  if (options.label) {
    cesiumOptions.label = new LabelGraphics({
      text: options.label.text,
      font: options.label.font ?? "14pt sans-serif",
      fillColor: options.label.fillColor
        ? toCesiumColor(options.label.fillColor)
        : undefined,
      outlineColor: options.label.outlineColor
        ? toCesiumColor(options.label.outlineColor)
        : undefined,
      outlineWidth: options.label.outlineWidth,
      pixelOffset: options.label.pixelOffset
        ? toCartesian2(options.label.pixelOffset)
        : undefined,
      scale: options.label.scale,
      showBackground: options.label.showBackground,
      backgroundColor: options.label.backgroundColor
        ? toCesiumColor(options.label.backgroundColor)
        : undefined,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.BOTTOM,
    });
  }

  // Polyline graphics
  if (options.polyline) {
    cesiumOptions.polyline = new PolylineGraphics({
      positions: toCartesian3Array(options.polyline.positions),
      width: options.polyline.style.width,
      material: toCesiumColor(options.polyline.style.color),
    });
  }

  // Polygon graphics
  if (options.polygon) {
    cesiumOptions.polygon = new PolygonGraphics({
      hierarchy: new PolygonHierarchy(toCartesian3Array(options.polygon.positions)),
      material: options.polygon.style.fillColor
        ? toCesiumColor(options.polygon.style.fillColor)
        : undefined,
      outline: options.polygon.style.outline ?? !!options.polygon.style.outlineColor,
      outlineColor: options.polygon.style.outlineColor
        ? toCesiumColor(options.polygon.style.outlineColor)
        : undefined,
      outlineWidth: options.polygon.style.outlineWidth,
    });
  }

  // Billboard graphics
  if (options.billboard) {
    cesiumOptions.billboard = new BillboardGraphics({
      image: options.billboard.image,
      scale: options.billboard.scale,
      pixelOffset: options.billboard.pixelOffset
        ? toCartesian2(options.billboard.pixelOffset)
        : undefined,
      rotation: options.billboard.rotation,
      width: options.billboard.width,
      height: options.billboard.height,
    });
  }

  // Model graphics
  if (options.model) {
    cesiumOptions.model = new ModelGraphics({
      uri: options.model.uri,
      scale: options.model.scale,
      minimumPixelSize: options.model.minimumPixelSize,
    });
  }

  // Ellipse graphics
  if (options.ellipse) {
    cesiumOptions.ellipse = new EllipseGraphics({
      semiMajorAxis: options.ellipse.semiMajorAxis,
      semiMinorAxis: options.ellipse.semiMinorAxis,
      rotation: options.ellipse.rotation,
      material: options.ellipse.fillColor
        ? toCesiumColor(options.ellipse.fillColor)
        : undefined,
      outline: options.ellipse.outline ?? !!options.ellipse.outlineColor,
      outlineColor: options.ellipse.outlineColor
        ? toCesiumColor(options.ellipse.outlineColor)
        : undefined,
      outlineWidth: options.ellipse.outlineWidth,
      height: options.ellipse.height,
      extrudedHeight: options.ellipse.extrudedHeight,
    });
  }

  // Properties
  if (options.properties) {
    cesiumOptions.properties = options.properties;
  }

  return cesiumOptions;
}

/**
 * Convert partial IEntityOptions to partial Cesium Entity options for updates
 */
export function toCesiumEntityUpdates(
  updates: Partial<IEntityOptions>,
): Partial<Entity.ConstructorOptions> {
  const cesiumUpdates: Partial<Entity.ConstructorOptions> = {};

  if (updates.name !== undefined) {
    cesiumUpdates.name = updates.name;
  }

  if (updates.description !== undefined) {
    cesiumUpdates.description = updates.description;
  }

  if (updates.show !== undefined) {
    cesiumUpdates.show = updates.show;
  }

  if (updates.position !== undefined) {
    cesiumUpdates.position = toCartesian3(updates.position);
  }

  // Add more update conversions as needed...

  return cesiumUpdates;
}
