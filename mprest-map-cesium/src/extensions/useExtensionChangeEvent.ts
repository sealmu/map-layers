import { useEffect } from "react";
import type { LayersPanelApi, FiltersPanelApi, SearchPanelApi, EntitiesApi } from "../types";

export const useExtensionChangeEvent = (
  layersApi: LayersPanelApi,
  filtersApi: FiltersPanelApi,
  searchApi: SearchPanelApi,
  entitiesApi: EntitiesApi,
  onExtensionStateChanged?: (
    name: 'layers' | 'filters' | 'search' | 'entities',
    state: LayersPanelApi | FiltersPanelApi | SearchPanelApi | EntitiesApi,
  ) => void,
) => {
  useEffect(() => {
    onExtensionStateChanged?.('layers', layersApi);
  }, [layersApi, onExtensionStateChanged]);

  useEffect(() => {
    onExtensionStateChanged?.('filters', filtersApi);
  }, [filtersApi, onExtensionStateChanged]);

  useEffect(() => {
    onExtensionStateChanged?.('search', searchApi);
  }, [searchApi, onExtensionStateChanged]);

  useEffect(() => {
    onExtensionStateChanged?.('entities', entitiesApi);
  }, [entitiesApi, onExtensionStateChanged]);
};