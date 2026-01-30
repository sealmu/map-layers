import { useState, useCallback, useMemo } from "react";
import { collectLayerData } from "../../helpers/collectLayerData";
import { useViewer } from "../../hooks/useViewer";
import type {
  LayerProps,
  LayerData,
  RendererRegistry,
  FilterData,
} from "../../types";

type Layer = LayerProps<LayerData, RendererRegistry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFilters = (ctx: Record<string, any>) => {
  const { layerStates } = ctx;
  const layers = ctx.layers as Layer[];
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
        // Use provider-agnostic accessors if available
        if (viewer.accessors) {
          const layerNames = viewer.accessors.getLayerNames();
          const matchingLayer = layerNames.find(
            (name) =>
              name.toLowerCase() === layerName.toLowerCase() ||
              name.toLowerCase() === displayName?.toLowerCase(),
          );

          if (matchingLayer) {
            const entities = viewer.accessors.getLayerEntities(matchingLayer);
            entities.forEach((entity) => {
              if (entity.renderType === type) {
                viewer.accessors!.setEntityVisibility(entity.id, visible, matchingLayer);
              }
            });
          }
        } else {
          // Fallback to direct Cesium access
          const dataSources = viewer.dataSources;
          for (let i = 0; i < dataSources.length; i++) {
            const dataSource = dataSources.get(i);
            const dsName = dataSource.name?.toLowerCase();
            if (
              dsName === layerName.toLowerCase() ||
              dsName === displayName?.toLowerCase()
            ) {
              const entities = dataSource.entities.values;
              entities.forEach((entity) => {
                const rendererType = entity.properties?.rendererType?.getValue();
                if (rendererType === type) {
                  entity.show = visible;
                }
              });
              break;
            }
          }
        }
      }
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
        isVisible: layerStates?.[layerId]?.isVisible ?? data.isVisible,
        isActive: layerStates?.[layerId]?.isActive ?? data.isActive,
        displayName: data.displayName,
      };

      // Read current entity visibility state from the map
      data.types.forEach((type) => {
        let typeVisible = true; // Default to visible

        // Use provider-agnostic accessors if available
        if (viewer.accessors) {
          const entities = viewer.accessors.getLayerEntities(layerId);
          const typeEntities = entities.filter((e) => e.renderType === type);
          if (typeEntities.length > 0) {
            typeVisible = typeEntities[0].show;
          }
        } else {
          // Fallback to direct Cesium access
          const dataSources = viewer.dataSources;
          for (let i = 0; i < dataSources.length; i++) {
            const dataSource = dataSources.get(i);
            const dsName = dataSource.name?.toLowerCase();
            const layerIdLower = layerId.toLowerCase();

            if (dsName === layerIdLower) {
              const entities = dataSource.entities.values;
              const typeEntities = entities.filter((entity) => {
                const rendererType = entity.properties?.rendererType?.getValue();
                return rendererType === type;
              });

              if (typeEntities.length > 0) {
                typeVisible = typeEntities[0].show;
              }
              break;
            }
          }
        }

        newFilterData[layerId].types[type] = typeVisible;
      });
    });

    return newFilterData;
  }, [layers, viewer, layerStates]);

  const openFilterModal = useCallback(() => {
    const newFilterData = collectFilterData();
    setFilterData(newFilterData);
    setIsFilterModalOpen(true);
  }, [collectFilterData]);

  const closeFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const api = useMemo(
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

  return api;
};
