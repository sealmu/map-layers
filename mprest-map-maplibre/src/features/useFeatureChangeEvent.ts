import { useEffect, useRef } from "react";
import type { LayersPanelApi, FiltersPanelApi, SearchPanelApi, EntitiesApi, FeatureState } from "../types";

export const useFeatureChangeEvent = (
  layersApi: LayersPanelApi,
  filtersApi: FiltersPanelApi,
  searchApi: SearchPanelApi,
  entitiesApi: EntitiesApi,
  onFeatureStateChanged?: (
    name: "layers" | "filters" | "search" | "entities",
    state: FeatureState,
  ) => void,
) => {
  const prevLayersRef = useRef<LayersPanelApi | null>(null);
  const prevFiltersRef = useRef<FiltersPanelApi | null>(null);
  const prevSearchRef = useRef<SearchPanelApi | null>(null);
  const prevEntitiesRef = useRef<EntitiesApi | null>(null);

  useEffect(() => {
    if (prevLayersRef.current !== layersApi) {
      prevLayersRef.current = layersApi;
      onFeatureStateChanged?.("layers", layersApi);
    }
  }, [layersApi, onFeatureStateChanged]);

  useEffect(() => {
    if (prevFiltersRef.current !== filtersApi) {
      prevFiltersRef.current = filtersApi;
      onFeatureStateChanged?.("filters", filtersApi);
    }
  }, [filtersApi, onFeatureStateChanged]);

  useEffect(() => {
    if (prevSearchRef.current !== searchApi) {
      prevSearchRef.current = searchApi;
      onFeatureStateChanged?.("search", searchApi);
    }
  }, [searchApi, onFeatureStateChanged]);

  useEffect(() => {
    if (prevEntitiesRef.current !== entitiesApi) {
      prevEntitiesRef.current = entitiesApi;
      onFeatureStateChanged?.("entities", entitiesApi);
    }
  }, [entitiesApi, onFeatureStateChanged]);
};
