import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../types";
import { useLayerManager } from "./managers/useLayerManager";
import { useFilterManager } from "./managers/useFilterManager";
import { useSearchManager } from "./managers/useSearchManager";
import { useEntitiesManager } from "./managers/useEntitiesManager";

export const useFeatures = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
) => {
  const layersPanelApi = useLayerManager(layers);
  const filtersPanelApi = useFilterManager(layers, layersPanelApi.layerStates);
  const searchPanelApi = useSearchManager(filtersPanelApi.filterData, layers);
  const entitiesApi = useEntitiesManager();

  return useMemo(
    () => ({
      layersPanelApi,
      filtersPanelApi,
      searchPanelApi,
      entitiesApi,
    }),
    [layersPanelApi, filtersPanelApi, searchPanelApi, entitiesApi],
  );
};
