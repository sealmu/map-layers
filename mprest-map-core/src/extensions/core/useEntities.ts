import { useCallback, useMemo } from "react";
import { useViewer } from "../../hooks/useViewer";
import { createLogger } from "../../utils/Logger";

const logger = createLogger("useEntities");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useEntities = (_ctx: Record<string, unknown>) => {
  const { viewer } = useViewer();

  /**
   * Find an entity by ID, optionally in a specific layer.
   * Returns the native entity for the provider (e.g., Cesium Entity).
   * For provider-agnostic metadata, use viewer.accessors.findEntityById().
   */
  const findEntity = useCallback(
    <T = unknown>(entityId: string, layerId?: string): T | null => {
      if (!viewer?.accessors) return null;

      const metadata = viewer.accessors.findEntityById(entityId, layerId);
      if (metadata) {
        return viewer.accessors.getNativeEntity<T>(entityId, layerId);
      }
      return null;
    },
    [viewer],
  );

  /**
   * Select an entity and optionally fly to it.
   * @param flyTo - if true, fly with default range; if number, use as range
   */
  const selectEntity = useCallback(
    (entityId: string, layerId?: string, flyTo?: boolean | number) => {
      if (!viewer?.accessors) return false;

      const success = viewer.accessors.selectEntity(entityId, layerId);
      if (success && flyTo) {
        if (typeof flyTo === "number") {
          viewer.accessors.flyToEntity(entityId, { layerName: layerId, range: flyTo });
        } else {
          viewer.accessors.flyToEntity(entityId, { layerName: layerId });
        }
      }
      if (!success) {
        logger.warn(
          `Entity with id "${entityId}" not found${layerId ? ` in layer "${layerId}"` : ""}`,
          { entityId, layerId }
        );
      }
      return success;
    },
    [viewer],
  );

  const api = useMemo(
    () => ({
      findEntity,
      selectEntity,
    }),
    [findEntity, selectEntity],
  );

  return api;
};
