import { useEffect } from "react";
import type { LayersPanelApi, FiltersPanelApi, SearchPanelApi, EntitiesApi } from "../types";

export const useFeatureChangeEvent = (
  layersApi: LayersPanelApi,
  filtersApi: FiltersPanelApi,
  searchApi: SearchPanelApi,
  entitiesApi: EntitiesApi,
  onFeatureStateChanged?: (
    name: 'layers' | 'filters' | 'search' | 'entities',
    state: LayersPanelApi | FiltersPanelApi | SearchPanelApi | EntitiesApi,
  ) => void,
) => {
  useEffect(() => {
    onFeatureStateChanged?.('layers', layersApi);
  }, [layersApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('filters', filtersApi);
  }, [filtersApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('search', searchApi);
  }, [searchApi, onFeatureStateChanged]);

  useEffect(() => {
    onFeatureStateChanged?.('entities', entitiesApi);
  }, [entitiesApi, onFeatureStateChanged]);
};