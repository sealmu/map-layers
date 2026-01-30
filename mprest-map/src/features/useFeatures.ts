import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../types";
import { useLayerManager } from "./managers/useLayerManager";
import { useFilterManager } from "./managers/useFilterManager";
import { useSearchManager } from "./managers/useSearchManager";
import { useEntitiesManager } from "./managers/useEntitiesManager";

export const useFeatures = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
) => {
  const layersApi = useLayerManager(layers);
  const filtersApi = useFilterManager(layers, layersApi.layerStates);
  const searchApi = useSearchManager(filtersApi.filterData, layers);
  const entitiesApi = useEntitiesManager();

  return useMemo(
    () => ({
      layersApi,
      filtersApi,
      searchApi,
      entitiesApi,
    }),
    [layersApi, filtersApi, searchApi, entitiesApi],
  );
};
