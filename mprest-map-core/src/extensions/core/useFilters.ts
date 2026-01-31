import { useState, useCallback, useMemo, useEffect } from "react";
import { collectLayerData } from "../../utils/collectLayerData";
import { useViewer } from "../../hooks/useViewer";
import type {
  ILayerProps,
  ILayerData,
  IRendererRegistry,
  IFilterData,
} from "../../types";

type Layer = ILayerProps<ILayerData, IRendererRegistry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFilters = (ctx: Record<string, any>) => {
  const { layerStates } = ctx;
  const layers = ctx.layers as Layer[];
  const [filterData, setFilterData] = useState<IFilterData>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { viewer } = useViewer();

  const handleFilterChange = useCallback(
    (
      layerName: string,
      _displayName: string,
      type: string,
      visible: boolean,
    ) => {
      // Only update state - useEffect will sync to map
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
    },
    [],
  );

  // Sync filterData changes to map in real-time while modal is open
  useEffect(() => {
    if (!viewer?.accessors || !isFilterModalOpen) return;

    // Apply all filter states to the map
    Object.entries(filterData).forEach(([layerName, layerData]) => {
      const layerNames = viewer.accessors!.getLayerNames();
      const matchingLayer = layerNames.find(
        (name) => name.toLowerCase() === layerName.toLowerCase(),
      );

      if (matchingLayer && layerData.types) {
        const entities = viewer.accessors!.getLayerEntities(matchingLayer);
        const updates: Array<{id: string, visible: boolean}> = [];

        Object.entries(layerData.types).forEach(([type, visible]) => {
          const matchingEntities = entities.filter((e) => e.renderType === type);
          matchingEntities.forEach((entity) => {
            updates.push({ id: entity.id, visible });
          });
        });

        if (updates.length > 0) {
          viewer.accessors!.batchSetEntityVisibility(updates, matchingLayer);
        }
      }
    });
  }, [filterData, viewer, isFilterModalOpen]);

  const collectFilterData = useCallback(() => {
    if (!layers || !viewer) return {};

    const layerData = collectLayerData(layers, viewer);

    // Create filter data from layer data
    const newFilterData: IFilterData = {};
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

        if (viewer.accessors) {
          const entities = viewer.accessors.getLayerEntities(layerId);
          const typeEntities = entities.filter((e) => e.renderType === type);
          if (typeEntities.length > 0) {
            typeVisible = typeEntities[0].show;
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
