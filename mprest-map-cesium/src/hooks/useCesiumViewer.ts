import { useViewer } from "@mprest/map-core";
import type { ViewerWithConfigs, RendererRegistry } from "../types";

/**
 * Cesium-specific viewer hook.
 * Returns the viewer already cast to the Cesium-specific ViewerWithConfigs type.
 *
 * @example
 * ```tsx
 * import { useCesiumViewer } from "@mprest/map-cesium";
 *
 * function MyComponent() {
 *   const { viewer } = useCesiumViewer();
 *   // viewer is ViewerWithConfigs | null (Cesium-specific)
 *   viewer?.dataSources.get(0);  // Access Cesium-specific APIs
 * }
 * ```
 */
export function useCesiumViewer<R extends RendererRegistry = RendererRegistry>(): {
  viewer: ViewerWithConfigs<R> | null;
  setViewer: (viewer: ViewerWithConfigs<R> | null) => void;
} {
  const { viewer, setViewer } = useViewer();

  return {
    viewer: viewer as ViewerWithConfigs<R> | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setViewer: setViewer as any,
  };
}
