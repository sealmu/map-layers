/**
 * Provider-agnostic renderers
 *
 * These renderers take ILayerData and return IEntityOptions,
 * which can then be converted to any provider's native format.
 */

import type { ILayerData, IEntityRenderer, IRendererRegistry, IEntityOptions } from "../types";
import { Colors } from "../types";

/**
 * Create a point entity from layer data
 */
export const createPoint: IEntityRenderer = (item: ILayerData): IEntityOptions => ({
  id: item.id,
  name: item.name,
  position: item.positions[0],
  point: {
    pixelSize: 10,
    color: item.color,
    outlineColor: Colors.WHITE,
    outlineWidth: 2,
  },
  properties: {
    layerId: item.view,
    renderType: item.renderType ?? "points",
  },
});

/**
 * Create a polygon entity from layer data
 */
export const createPolygon: IEntityRenderer = (item: ILayerData): IEntityOptions => ({
  id: item.id,
  name: item.name,
  polygon: {
    positions: item.positions,
    style: {
      fillColor: Colors.withAlpha(item.color, 0.5),
      outline: true,
      outlineColor: item.color,
      outlineWidth: 2,
    },
  },
  properties: {
    layerId: item.view,
    renderType: item.renderType ?? "polygons",
  },
});

/**
 * Create a polyline entity from layer data
 */
export const createPolyline: IEntityRenderer = (item: ILayerData): IEntityOptions => ({
  id: item.id,
  name: item.name,
  polyline: {
    positions: item.positions,
    style: {
      width: 3,
      color: item.color,
    },
  },
  properties: {
    layerId: item.view,
    renderType: item.renderType ?? "polylines",
  },
});

/**
 * Create a label entity from layer data
 */
export const createLabel: IEntityRenderer = (item: ILayerData): IEntityOptions => ({
  id: item.id,
  name: item.name,
  position: item.positions[0],
  label: {
    text: item.name,
    font: "14pt sans-serif",
    fillColor: item.color,
    outlineColor: Colors.BLACK,
    outlineWidth: 2,
    pixelOffset: { x: 0, y: -20 },
  },
  properties: {
    layerId: item.view,
    renderType: item.renderType ?? "labels",
  },
});

/**
 * Create an ellipse/dome entity from layer data
 */
export const createEllipse: IEntityRenderer = (item: ILayerData): IEntityOptions => ({
  id: item.id,
  name: item.name,
  position: item.positions[0],
  ellipse: {
    semiMajorAxis: 10000,
    semiMinorAxis: 10000,
    fillColor: Colors.withAlpha(item.color, 0.3),
    outline: true,
    outlineColor: item.color,
  },
  properties: {
    layerId: item.view,
    renderType: item.renderType ?? "ellipses",
  },
});

/**
 * Default provider-agnostic renderers
 */
export const defaultAgnosticRenderers = {
  points: createPoint,
  polygons: createPolygon,
  polylines: createPolyline,
  labels: createLabel,
  ellipses: createEllipse,
} as const satisfies IRendererRegistry;

/**
 * Utility to create custom renderers
 */
export function createRenderer(
  renderFn: (item: ILayerData) => Partial<IEntityOptions>,
): IEntityRenderer {
  return (item: ILayerData): IEntityOptions => ({
    id: item.id,
    name: item.name,
    ...renderFn(item),
    properties: {
      layerId: item.view,
      renderType: item.renderType ?? "custom",
      ...(renderFn(item).properties || {}),
    },
  });
}
