import type { LayerProps, LayerData, RendererRegistry } from "../types";
import { useLayerManager } from "./useLayerManager";
import { useFilterManager } from "./useFilterManager";
import { useSearchManager } from "./useSearchManager";
import { useEntitiesManager } from "./useEntitiesManager";

export const useFeatures = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
) => {
  const layersPanelApi = useLayerManager(layers);
  const filtersPanelApi = useFilterManager(layers, layersPanelApi.layerStates);
  const searchPanelApi = useSearchManager(filtersPanelApi.filterData, layers);
  const entitiesApi = useEntitiesManager();

  return {
    layersPanelApi,
    filtersPanelApi,
    searchPanelApi,
    entitiesApi,
  };
};
