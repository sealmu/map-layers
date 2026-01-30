import type { ICoordinate } from "./coordinates";
import type { IColor } from "./graphics";
import type { IEntityOptions } from "../interfaces/IMapEntity";

/**
 * Provider-agnostic layer data interface
 * Replaces the Cesium-specific LayerData
 */
export interface ILayerData {
  id: string;
  name: string;
  color: IColor;
  positions: ICoordinate[];
  view: string;
  renderType?: string;
  customRenderer?: IEntityRenderer;
  data?: unknown;
}

/**
 * Entity renderer function type
 */
export type IEntityRenderer = (item: ILayerData) => IEntityOptions;

/**
 * Renderer registry type
 */
export type IRendererRegistry = Record<string, IEntityRenderer>;

/**
 * Helper to create render types from a renderer registry
 */
export function createIRenderTypes<R extends IRendererRegistry>(
  renderers: R,
): Record<Uppercase<keyof R & string> | "CUSTOM", (keyof R & string) | "custom"> {
  return {
    ...Object.keys(renderers).reduce(
      (acc, key) => {
        acc[key.toUpperCase() as Uppercase<keyof R & string>] = key as keyof R & string;
        return acc;
      },
      {} as Record<Uppercase<keyof R & string>, keyof R & string>,
    ),
    CUSTOM: "custom" as const,
  } as Record<Uppercase<keyof R & string> | "CUSTOM", (keyof R & string) | "custom">;
}
