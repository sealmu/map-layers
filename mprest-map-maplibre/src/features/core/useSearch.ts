import { useState, useCallback, useMemo, useEffect } from "react";
import { collectLayerData } from "../../helpers/collectLayerData";
import { useViewer } from "@mprest/map-core";
import type {
  LayerProps,
  LayerData,
  RendererRegistry,
  SearchData,
  SearchResult,
  ViewerWithConfigs,
} from "../../types";

type Layer = LayerProps<LayerData, RendererRegistry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSearch = (ctx: Record<string, any>) => {
  const { filterData } = ctx;
  const layers = ctx.layers as Layer[];
  const [searchData, setSearchData] = useState<SearchData>({});
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilterData, setSearchFilterData] = useState<
    Record<string, { types: Record<string, boolean> }>
  >({});
  const { viewer: coreViewer } = useViewer();
  const viewer = coreViewer as unknown as ViewerWithConfigs | null;

  const collectSearchData = useCallback(
    (layers: Layer[]) => {
      if (!viewer) return {};

      const layerData = collectLayerData(layers, viewer);

      const newSearchData: SearchData = {};
      Object.entries(layerData).forEach(([layerId, data]) => {
        // Get enabled types
        const enabledTypes = Array.from(data.types).filter(
          (type: string) =>
            !filterData || (filterData[layerId]?.types[type] ?? true),
        );
        const enabledTypesCount = enabledTypes.length;
        const hasEnabledTypes = enabledTypesCount > 0;

        newSearchData[layerId] = {
          ...data,
          enabled: data.hasDataSource && data.isVisible && hasEnabledTypes,
          enabledTypesCount,
        };
      });

      return newSearchData;
    },
    [viewer, filterData],
  );

  const handleLayerToggle = useCallback(
    (layerName: string, enabled: boolean) => {
      setSearchData((prev) => {
        const newData = {
          ...prev,
          [layerName]: {
            ...prev[layerName],
            enabled,
          },
        };
        const enabledMap: Record<string, boolean> = {};
        Object.entries(newData).forEach(([layerId, layer]) => {
          enabledMap[layerId] = layer.enabled;
        });
        localStorage.setItem("searchEnabledLayers", JSON.stringify(enabledMap));
        return newData;
      });
    },
    [],
  );

  const updateSearchResults = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const results: SearchResult[] = [];
      Object.entries(searchData).forEach(([, layerData]) => {
        if (layerData.enabled) {
          layerData.entities.forEach((entity) => {
            const entityType = entity.renderType;
            const isTypeEnabled =
              !searchFilterData ||
              !entityType ||
              ((searchFilterData[entity.layerId]?.types[entityType] ?? true) &&
                (filterData?.[entity.layerId]?.types[entityType] ?? true));

            if (
              isTypeEnabled &&
              (entity.name.toLowerCase().includes(query.toLowerCase()) ||
                entity.id.toLowerCase().includes(query.toLowerCase()))
            ) {
              results.push(entity);
            }
          });
        }
      });
      setSearchResults(results);
    },
    [searchData, searchFilterData, filterData],
  );

  const performSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      updateSearchResults(query);
    },
    [updateSearchResults],
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      updateSearchResults(searchQuery);
    }
  }, [searchFilterData, updateSearchResults, searchQuery]);

  const openSearchModal = useCallback(() => {
    if (!layers) return;
    const newSearchData = collectSearchData(layers);
    const savedEnabled = localStorage.getItem("searchEnabledLayers");
    let enabledMap: Record<string, boolean> = {};
    if (savedEnabled) {
      enabledMap = JSON.parse(savedEnabled);
    }
    Object.keys(newSearchData).forEach((layerId) => {
      if (enabledMap[layerId] === true && newSearchData[layerId].enabled) {
        newSearchData[layerId].enabled = true;
      }
    });
    const validEnabledMap: Record<string, boolean> = {};
    Object.entries(newSearchData).forEach(([layerId, layer]) => {
      if (layer.hasDataSource && layer.isVisible) {
        validEnabledMap[layerId] = layer.enabled;
      }
    });
    localStorage.setItem(
      "searchEnabledLayers",
      JSON.stringify(validEnabledMap),
    );

    setSearchData(newSearchData);
    const savedFilters = localStorage.getItem("searchFilters");
    let searchFilters = JSON.parse(JSON.stringify(filterData || {}));
    if (savedFilters) {
      const loadedFilters = JSON.parse(savedFilters);
      searchFilters = {};
      Object.entries(
        loadedFilters as Record<string, { types: Record<string, boolean> }>,
      ).forEach(([layerId, layerFilters]) => {
        if (newSearchData[layerId] && newSearchData[layerId].enabled) {
          searchFilters[layerId] = { types: {} };
          Object.entries(layerFilters.types).forEach(([type, enabled]) => {
            if (
              newSearchData[layerId].types.has(type) &&
              (filterData?.[layerId]?.types[type] ?? true)
            ) {
              searchFilters[layerId].types[type] = enabled;
            }
          });
        }
      });
    }
    setSearchFilterData(searchFilters);
    localStorage.setItem("searchFilters", JSON.stringify(searchFilters));
    setIsSearchModalOpen(true);
  }, [collectSearchData, layers, filterData]);

  const closeSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
    setSearchResults([]);
    setSearchQuery("");
  }, []);

  const handleTypeToggle = useCallback(
    (layerId: string, type: string, enabled: boolean) => {
      setSearchFilterData((prev) => {
        const newData = {
          ...prev,
          [layerId]: {
            ...prev[layerId],
            types: {
              ...prev[layerId]?.types,
              [type]: enabled,
            },
          },
        };
        localStorage.setItem("searchFilters", JSON.stringify(newData));
        return newData;
      });
    },
    [],
  );

  const api = useMemo(
    () => ({
      searchData,
      searchFilterData,
      isSearchModalOpen,
      searchResults,
      searchQuery,
      handleLayerToggle,
      handleTypeToggle,
      performSearch,
      openSearchModal,
      closeSearchModal,
    }),
    [
      searchData,
      searchFilterData,
      isSearchModalOpen,
      searchResults,
      searchQuery,
      handleLayerToggle,
      handleTypeToggle,
      performSearch,
      openSearchModal,
      closeSearchModal,
    ],
  );

  return api;
};
