import { useEffect, useRef } from "react";
import type { LayersPanelApi, FiltersPanelApi, SearchPanelApi, EntitiesApi, ExtensionState } from "../types";

export const useExtensionChangeEvent = (
  layersApi: LayersPanelApi,
  filtersApi: FiltersPanelApi,
  searchApi: SearchPanelApi,
  entitiesApi: EntitiesApi,
  onExtensionStateChanged?: (
    name: "layers" | "filters" | "search" | "entities",
    state: ExtensionState,
  ) => void,
) => {
  const prevLayersRef = useRef<LayersPanelApi | null>(null);
  const prevFiltersRef = useRef<FiltersPanelApi | null>(null);
  const prevSearchRef = useRef<SearchPanelApi | null>(null);
  const prevEntitiesRef = useRef<EntitiesApi | null>(null);

  useEffect(() => {
    if (prevLayersRef.current !== layersApi) {
      prevLayersRef.current = layersApi;
      onExtensionStateChanged?.("layers", layersApi);
    }
  }, [layersApi, onExtensionStateChanged]);

  useEffect(() => {
    if (prevFiltersRef.current !== filtersApi) {
      prevFiltersRef.current = filtersApi;
      onExtensionStateChanged?.("filters", filtersApi);
    }
  }, [filtersApi, onExtensionStateChanged]);

  useEffect(() => {
    if (prevSearchRef.current !== searchApi) {
      prevSearchRef.current = searchApi;
      onExtensionStateChanged?.("search", searchApi);
    }
  }, [searchApi, onExtensionStateChanged]);

  useEffect(() => {
    if (prevEntitiesRef.current !== entitiesApi) {
      prevEntitiesRef.current = entitiesApi;
      onExtensionStateChanged?.("entities", entitiesApi);
    }
  }, [entitiesApi, onExtensionStateChanged]);
};
