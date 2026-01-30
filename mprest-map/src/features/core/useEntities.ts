import { useCallback, useMemo } from "react";
import type { Entity } from "cesium";
import { useViewer } from "../../hooks/useViewer";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useEntities = (_ctx: Record<string, unknown>) => {
  const { viewer } = useViewer();

  const findEntity = useCallback(
    (entityId: string, layerId?: string): Entity | null => {
      if (!viewer) return null;

      // Use provider-agnostic accessors if available
      if (viewer.accessors) {
        const metadata = viewer.accessors.findEntityById(entityId, layerId);
        if (metadata) {
          // Return native entity for backwards compatibility
          return viewer.accessors.getNativeEntity<Entity>(entityId, layerId);
        }
        return null;
      }

      // Fallback to direct Cesium access for backwards compatibility
      for (let i = 0; i < viewer.dataSources.length; i++) {
        const dataSource = viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(entityId);
        if (entity) {
          if (layerId) {
            const entityLayerId = entity.properties?.layerId?.getValue();
            if (entityLayerId === layerId) {
              return entity;
            }
          } else {
            return entity;
          }
        }
      }

      return null;
    },
    [viewer],
  );

  const selectEntity = useCallback(
    (entityId: string, layerId?: string, flyTo?: boolean | number) => {
      if (!viewer) return false;

      // Use provider-agnostic accessors if available
      if (viewer.accessors) {
        const success = viewer.accessors.selectEntity(entityId, layerId);
        if (success && flyTo) {
          if (typeof flyTo === "number") {
            viewer.accessors.flyToEntity(entityId, { layerName: layerId, range: flyTo });
          } else {
            viewer.accessors.flyToEntity(entityId, { layerName: layerId });
          }
        }
        if (!success) {
          console.warn(
            `Entity with id "${entityId}" not found${layerId ? ` in layer "${layerId}"` : ""}`,
          );
        }
        return success;
      }

      // Fallback to direct Cesium access
      const entity = findEntity(entityId, layerId);
      if (entity) {
        viewer.selectedEntity = entity;
        if (flyTo) {
          // Import HeadingPitchRange dynamically for fallback
          import("cesium").then(({ HeadingPitchRange }) => {
            if (typeof flyTo === "number") {
              const currentHeading = viewer.camera.heading;
              const currentPitch = viewer.camera.pitch;
              viewer.flyTo(entity, {
                offset: new HeadingPitchRange(currentHeading, currentPitch, flyTo),
              });
            } else {
              viewer.flyTo(entity);
            }
          });
        }
        return true;
      }

      console.warn(
        `Entity with id "${entityId}" not found${layerId ? ` in layer "${layerId}"` : ""}`,
      );
      return false;
    },
    [findEntity, viewer],
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
