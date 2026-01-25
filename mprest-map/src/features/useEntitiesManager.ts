import { useCallback, useMemo } from "react";
import { useViewer } from "../hooks/useViewer";
import { HeadingPitchRange } from "cesium";

export const useEntitiesManager = () => {
  const { viewer } = useViewer();

  const findEntity = useCallback(
    (entityId: string, layerId?: string) => {
      if (!viewer) return null;

      // Find the entity across all data sources
      for (let i = 0; i < viewer.dataSources.length; i++) {
        const dataSource = viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(entityId);
        if (entity) {
          // If layerId is provided, check if it matches
          if (layerId) {
            const entityLayerId = entity.properties?.layerId?.getValue();
            if (entityLayerId === layerId) {
              return entity;
            }
          } else {
            // If no layerId specified, return the first matching entity
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
      /* eslint-disable react-hooks/immutability */
      const entity = findEntity(entityId, layerId);
      if (entity && viewer) {
        viewer.selectedEntity = entity;
        if (flyTo) {
          if (typeof flyTo === "number") {
            // Maintain current heading and pitch, use provided range
            const currentHeading = viewer.camera.heading;
            const currentPitch = viewer.camera.pitch;
            viewer.flyTo(entity, {
              offset: new HeadingPitchRange(
                currentHeading,
                currentPitch,
                flyTo,
              ),
            });
          } else if (typeof flyTo === "boolean") {
            viewer.flyTo(entity);
          }
        }
        return true;
      }

      console.warn(
        `Entity with id "${entityId}" not found${layerId ? ` in layer "${layerId}"` : ""}`,
      );
      return false;
      /* eslint-enable react-hooks/immutability */
    },
    [findEntity, viewer],
  );

  const entitiesApi = useMemo(
    () => ({
      findEntity,
      selectEntity,
    }),
    [findEntity, selectEntity],
  );

  return entitiesApi;
};
