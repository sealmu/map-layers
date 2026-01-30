import { useState, useCallback, useMemo, useEffect } from "react";
import { collectLayerData } from "../../helpers/collectLayerData";
import { useViewer } from "@mprest/map-core";
import type {
  LayerProps,
  LayerData,
  RendererRegistry,
  FilterData,
  ViewerWithConfigs,
} from "../../types";

type Layer = LayerProps<LayerData, RendererRegistry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFilters = (ctx: Record<string, any>) => {
  const { layerStates } = ctx;
  const layers = ctx.layers as Layer[];
  const [filterData, setFilterData] = useState<FilterData>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { viewer: coreViewer } = useViewer();
  const viewer = coreViewer as unknown as ViewerWithConfigs | null;

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

  // Sync filterData changes to map in real-time
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
        let lastUpdatedLayer: string | null = null;

        Object.entries(layerData.types).forEach(([type, visible]) => {
          const matchingEntities = entities.filter((e) => e.renderType === type);
          matchingEntities.forEach((entity) => {
            // Update without triggering source update
            viewer.accessors!.setEntityVisibility(entity.id, visible, matchingLayer, false);
            lastUpdatedLayer = matchingLayer;
          });
        });

        // Trigger single source update per layer
        if (lastUpdatedLayer) {
          const layerFeatures = viewer.featureStore.get(lastUpdatedLayer);
          if (layerFeatures) {
            const map = viewer.map;
            const source = map.getSource(lastUpdatedLayer);
            if (source && source.type === "geojson") {
              (source as import("maplibre-gl").GeoJSONSource).setData({
                type: "FeatureCollection",
                features: Array.from(layerFeatures.values()),
              });
            }
          }
        }
      }
    });
  }, [filterData, viewer, isFilterModalOpen]);

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
