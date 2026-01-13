import { useState, useCallback, useMemo } from "react";
import { collectLayerData } from "../helpers/collectLayerData";
import { useViewer } from "./useViewer";
import type { LayerConfig, FilterData } from "../types";

export const useFilterManager = (layers?: LayerConfig[]) => {
  const [filterData, setFilterData] = useState<FilterData>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { viewer } = useViewer();

  const handleFilterChange = useCallback(
    (
      layerName: string,
      displayName: string,
      type: string,
      visible: boolean,
    ) => {
      setFilterData((prev) => ({
        ...prev,
        [layerName]: {
          ...prev[layerName],
          types: {
            ...prev[layerName]?.types,
            [type]: visible,
          },
        },
      }));

      // Apply the filter to actually hide/show entities based on type
      if (viewer) {
        const dataSources = viewer.dataSources;
        for (let i = 0; i < dataSources.length; i++) {
          const dataSource = dataSources.get(i);
          // Match data source name/id to layer id
          const dsName = dataSource.name?.toLowerCase();
          if (dsName === (displayName || layerName).toLowerCase()) {
            // Update entity visibility based on type
            const entities = dataSource.entities.values;
            entities.forEach((entity) => {
              // Get rendererType from entity properties
              const rendererType = entity.properties?.rendererType?.getValue();
              if (rendererType === type) {
                entity.show = visible;
              }
            });
            break;
          }
        }
      }

      console.log(
        `Layer ${displayName}, type ${type}: ${visible ? "visible" : "hidden"}`,
      );
    },
    [viewer],
  );

  const collectFilterData = useCallback(() => {
    if (!layers || !viewer) return {};

    const layerData = collectLayerData(layers, viewer);

    // Create filter data from layer data
    const newFilterData: FilterData = {};
    Object.entries(layerData).forEach(([layerId, data]) => {
      newFilterData[layerId] = {
        types: {},
        hasDataSource: data.hasDataSource,
        isVisible: data.isVisible,
        isActive: data.isActive,
        displayName: data.displayName,
      };

      // Read current entity visibility state from the map
      data.types.forEach((type) => {
        // Find the data source for this layer
        const dataSources = viewer.dataSources;
        let typeVisible = true; // Default to visible

        for (let i = 0; i < dataSources.length; i++) {
          const dataSource = dataSources.get(i);
          const dsName = dataSource.name?.toLowerCase();
          const layerIdLower = layerId.toLowerCase();

          if (dsName === layerIdLower) {
            // Check current visibility of entities of this type
            const entities = dataSource.entities.values;
            const typeEntities = entities.filter((entity) => {
              const rendererType = entity.properties?.rendererType?.getValue();
              return rendererType === type;
            });

            // If any entities of this type exist, use the visibility of the first one
            // (assuming all entities of the same type have the same visibility)
            if (typeEntities.length > 0) {
              typeVisible = typeEntities[0].show;
            }
            break;
          }
        }

        newFilterData[layerId].types[type] = typeVisible;
      });
    });

    return newFilterData;
  }, [layers, viewer]);

  const openFilterModal = useCallback(() => {
    const newFilterData = collectFilterData();
    setFilterData(newFilterData);
    setIsFilterModalOpen(true);
  }, [collectFilterData]);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const filtersPanelApi = useMemo(
    () => ({
      filterData,
      isFilterModalOpen,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
    }),
    [
      filterData,
      isFilterModalOpen,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
    ],
  );

  return filtersPanelApi;
};
