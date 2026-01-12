import { useState, useCallback, useMemo } from "react";
import type { LayerConfig, ViewerWithConfigs } from "../types";

export type FilterData = Record<
  string,
  {
    types: Record<string, boolean>;
    layerType?: string;
    hasDataSource?: boolean;
    isVisible?: boolean;
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

      // Collect filter data from all actual layers being rendered
      const newFilterData: FilterData = {};

      // Get all layers from the map API, excluding base/imagery layers
      const allLayers = layers.filter((layer: LayerConfig) => {
        // Exclude base map layers and imagery layers
        const excludeIds = [
          "street-map",
          "openstreetmap",
          "base-layer",
          "imagery",
        ];
        return (
          !excludeIds.includes(layer.id.toLowerCase()) &&
          !layer.id.includes("imagery") &&
          !layer.id.includes("base")
        );
      });

      allLayers.forEach((layer) => {
        // Collect unique renderTypes from actual entities in the viewer
        const types = new Set<string>();
        let hasDataSource = false;
        const isVisible = layer.isVisible !== false; // Default to true if not specified

        // Find the data source for this layer and collect entity types
        const dataSources = viewer.dataSources;
        for (let i = 0; i < dataSources.length; i++) {
          const dataSource = dataSources.get(i);
          // Match data source name/id to layer id
          const dsName = dataSource.name?.toLowerCase();
          const layerId = layer.id.toLowerCase();
          if (dsName === layerId) {
            hasDataSource = true;
            // Extract entity types from this data source using stored properties
            const entities = dataSource.entities.values;
            entities.forEach((entity) => {
              // Get rendererType from entity properties
              const rendererType = entity.properties?.rendererType?.getValue();
              if (rendererType) {
                if (rendererType != layerId) types.add(rendererType);
              }
            });
            break;
          }
        }

        // If no types found, use "custom" as fallback
        if (types.size === 0) {
          types.add(layer.id.toLowerCase());
        }

        newFilterData[layer.id] = {
          types: {},
          hasDataSource,
          isVisible,
          // layerType: "custom",
        };

        // Preserve existing filter state or default to visible
        types.forEach((type) => {
          const existingState = filterData[layer.id]?.types[type];
          newFilterData[layer.id].types[type] =
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
    (layerName: string, type: string, visible: boolean) => {
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
          const layerId = layerName.toLowerCase();
          if (dsName === layerId) {
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
        `Layer ${layerName}, type ${type}: ${visible ? "visible" : "hidden"}`,
      );
    },
    [viewerRef],
  );

  const openFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const getFilters = useCallback(() => {
    return (renderType: string, layerName: string): boolean => {
      return filterData[layerName]?.types[renderType] ?? true;
    };
  }, [filterData]);

  const filtersPanelApi = useMemo(
    () => ({
      filterData,
      isFilterModalOpen,
      collectFilterData,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
      getFilters,
    }),
    [
      filterData,
      isFilterModalOpen,
      collectFilterData,
      handleFilterChange,
      openFilterModal,
      closeFilterModal,
      getFilters,
    ],
  );

  return filtersPanelApi;
};
