import { useEffect } from "react";
import type { LayersPanelApi, FiltersPanelApi, SearchPanelApi, EntitiesApi } from "../types";

export const useFeatureChangeEvent = (
  layersPanelApi: LayersPanelApi,
  filtersPanelApi: FiltersPanelApi,
  searchPanelApi: SearchPanelApi,
  entitiesApi: EntitiesApi,
  onFeatureStateChanged?: (
    name: 'layersPanel' | 'filtersPanel' | 'searchPanel' | 'entities',
    state: LayersPanelApi | FiltersPanelApi | SearchPanelApi | EntitiesApi,
  ) => void,
) => {
  useEffect(() => {
    onFeatureStateChanged?.('layersPanel', layersPanelApi);
  }, [layersPanelApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('filtersPanel', filtersPanelApi);
  }, [filtersPanelApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('searchPanel', searchPanelApi);
  }, [searchPanelApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('entities', entitiesApi);
  }, [entitiesApi, onFeatureStateChanged]);
};