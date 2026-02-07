import { useState, useCallback, useMemo, useEffect } from "react";
import { collectLayerData } from "../../utils/collectLayerData";
import { useViewer } from "../../hooks/useViewer";
import type {
  ILayerProps,
  ILayerData,
  IRendererRegistry,
  IFilterData,
  IFilterConfig,
} from "../../types";

type Layer = ILayerProps<ILayerData, IRendererRegistry>;

function mergeFilterConfigs(
  mapLevel?: IFilterConfig,
  layerLevel?: IFilterConfig,
): IFilterConfig | undefined {
  if (!mapLevel && !layerLevel) return undefined;
  if (!mapLevel) return layerLevel;
  if (!layerLevel) return mapLevel;
  return {
    ...mapLevel,
    ...layerLevel,
    types: {
      ...mapLevel.types,
      ...layerLevel.types,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFilters = (ctx: Record<string, any>) => {
  const { layerStates } = ctx;
  const layers = ctx.layers as Layer[];
  const mapFilterConfig = ctx.filterConfig as Record<string, IFilterConfig> | undefined;
  const [filterData, setFilterData] = useState<IFilterData>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { viewer } = useViewer();

  // Compute merged filter configs for all layers
  const mergedFilterConfigs = useMemo(() => {
    if (!layers) return {};
    const configs: Record<string, IFilterConfig | undefined> = {};
    layers.forEach((layer) => {
      configs[layer.id] = mergeFilterConfigs(mapFilterConfig?.[layer.id], layer.filterConfig);
    });
    return configs;
  }, [layers, mapFilterConfig]);

  // Seed filterData with isHidden types set to false,
  // so DataSourceLayer respects them on entity creation
  useEffect(() => {
    setFilterData((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(mergedFilterConfigs).forEach(([layerId, config]) => {
        if (!config?.types) return;
        Object.entries(config.types).forEach(([type, typeConfig]) => {
          // isHidden: always force to false
          if (typeConfig.isHidden && next[layerId]?.types?.[type] !== false) {
            changed = true;
            next[layerId] = {
              ...next[layerId],
              types: { ...next[layerId]?.types, [type]: false },
              displayName: next[layerId]?.displayName ?? layerId,
            };
          }
          // initialVisibility: seed only when no existing entry (user can change later)
          if (
            !typeConfig.isHidden &&
            typeConfig.initialVisibility !== undefined &&
            next[layerId]?.types?.[type] === undefined
          ) {
            changed = true;
            next[layerId] = {
              ...next[layerId],
              types: { ...next[layerId]?.types, [type]: typeConfig.initialVisibility },
              displayName: next[layerId]?.displayName ?? layerId,
            };
          }
        });
      });

      return changed ? next : prev;
    });
  }, [mergedFilterConfigs]);

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
          // Respect isHidden config - never allow hidden types to become visible
          const typeConfig = layerData.filterConfig?.types?.[type];
          const effectiveVisible = typeConfig?.isHidden ? false : visible;
          const matchingEntities = entities.filter((e) => e.renderType === type);
          matchingEntities.forEach((entity) => {
            updates.push({ id: entity.id, visible: effectiveVisible });
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
      const layer = layers.find((l) => l.id === layerId);
      newFilterData[layerId] = {
        types: {},
        hasDataSource: data.hasDataSource,
        isVisible: layerStates?.[layerId]?.isVisible ?? data.isVisible,
        isActive: layerStates?.[layerId]?.isActive ?? data.isActive,
        displayName: data.displayName,
        filterConfig: mergeFilterConfigs(mapFilterConfig?.[layerId], layer?.filterConfig),
      };

      // Read current entity visibility state from the map
      const mergedConfig = newFilterData[layerId].filterConfig;
      data.types.forEach((type) => {
        // If isHidden, force to false
        if (mergedConfig?.types?.[type]?.isHidden) {
          newFilterData[layerId].types[type] = false;
          return;
        }

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
  }, [layers, viewer, layerStates, mapFilterConfig]);

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
