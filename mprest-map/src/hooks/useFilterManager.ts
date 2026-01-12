import { useState, useCallback, useMemo } from "react";
import { collectLayerData } from "../helpers/collectLayerData";
import type { LayerConfig, ViewerWithConfigs } from "../types";

export type FilterData = Record<
  string,
  {
    types: Record<string, boolean>;
    layerType?: string;
    hasDataSource?: boolean;
    isVisible?: boolean;
    displayName: string;
  }
>;

export const useFilterManager = () => {
  const [filterData, setFilterData] = useState<FilterData>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewerRef, setViewerRef] = useState<ViewerWithConfigs | null>(null);

  const reapplyFilters = useCallback(
    (currentFilterData: FilterData) => {
      if (!viewerRef) return;

      // Apply current filter state to all entities
      Object.entries(currentFilterData).forEach(([layerName, layerData]) => {
        const dataSources = viewerRef.dataSources;
        for (let i = 0; i < dataSources.length; i++) {
          const dataSource = dataSources.get(i);
          const dsName = dataSource.name?.toLowerCase();
          const layerId = layerName.toLowerCase();

          if (dsName === layerId) {
            const entities = dataSource.entities.values;
            entities.forEach((entity) => {
              const rendererType = entity.properties?.rendererType?.getValue();
              if (rendererType && layerData.types[rendererType] !== undefined) {
                entity.show = layerData.types[rendererType];
              }
            });
            break;
          }
        }
      });
    },
    [viewerRef],
  );

  const collectFilterData = useCallback(
    (layers: LayerConfig[], viewer: ViewerWithConfigs | null) => {
      if (!viewer) return;

      setViewerRef(viewer);

      const layerData = collectLayerData(layers, viewer);

      // Create filter data from layer data
      const newFilterData: FilterData = {};
      Object.entries(layerData).forEach(([layerId, data]) => {
        newFilterData[layerId] = {
          types: {},
          hasDataSource: data.hasDataSource,
          isVisible: data.isVisible,
          displayName: data.displayName,
        };

        // Preserve existing filter state or default to visible
        data.types.forEach((type) => {
          const existingState = filterData[layerId]?.types[type];
          newFilterData[layerId].types[type] =
            existingState !== undefined ? existingState : true;
        });
      });

      setFilterData(newFilterData);
      setIsFilterModalOpen(true);

      // Reapply current filter state to entities
      reapplyFilters(newFilterData);
    },
    [viewerRef, filterData, reapplyFilters],
  );

  const handleFilterChange = useCallback(
    (layerName: string, displayName: string, type: string, visible: boolean) => {
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
      if (viewerRef) {
        const dataSources = viewerRef.dataSources;
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
    [viewerRef, filterData],
  );

  const openFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const filtersPanelApi = useMemo(
    () => ({
      filterData,
      isFilterModalOpen,
      collectFilterData,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
    }),
    [
      filterData,
      isFilterModalOpen,
      collectFilterData,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
    ],
  );

  return filtersPanelApi;
};
