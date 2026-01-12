import { useState, useCallback, useMemo } from "react";
import { collectLayerData, type LayerData } from "../helpers/collectLayerData";
import type { LayerConfig, ViewerWithConfigs } from "../types";

export type SearchData = Record<string, LayerData & { enabled: boolean }>;

export type SearchResult = {
    id: string;
    name: string;
    layerId: string;
};

export const useSearchManager = () => {
    const [searchData, setSearchData] = useState<SearchData>({});
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const collectSearchData = useCallback(
        (layers: LayerConfig[], viewer: ViewerWithConfigs | null) => {
            if (!viewer) return;

            const layerData = collectLayerData(layers, viewer);

            const newSearchData: SearchData = {};
            Object.entries(layerData).forEach(([layerId, data]) => {
                newSearchData[layerId] = {
                    ...data,
                    enabled: data.hasDataSource && data.isVisible,
                };
            });

            setSearchData(newSearchData);
            setIsSearchModalOpen(true);
        },
        [],
    );

    const handleLayerToggle = useCallback((layerName: string, enabled: boolean) => {
        setSearchData((prev) => ({
            ...prev,
            [layerName]: {
                ...prev[layerName],
                enabled,
            },
        }));
    }, []);

    const performSearch = useCallback(
        (query: string) => {
            setSearchQuery(query);
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            const results: SearchResult[] = [];
            Object.entries(searchData).forEach(([, layerData]) => {
                if (layerData.enabled) {
                    layerData.entities.forEach((entity) => {
                        if (
                            entity.name.toLowerCase().includes(query.toLowerCase()) ||
                            entity.id.toLowerCase().includes(query.toLowerCase())
                        ) {
                            results.push(entity);
                        }
                    });
                }
            });
            setSearchResults(results);
        },
        [searchData],
    );

    const openSearchModal = useCallback(() => {
        setIsSearchModalOpen(true);
    }, []);

    const closeSearchModal = useCallback(() => {
        setIsSearchModalOpen(false);
        setSearchResults([]);
        setSearchQuery("");
    }, []);

    const searchPanelApi = useMemo(
        () => ({
            searchData,
            isSearchModalOpen,
            searchResults,
            searchQuery,
            collectSearchData,
            handleLayerToggle,
            performSearch,
            openSearchModal,
            closeSearchModal,
        }),
        [
            searchData,
            isSearchModalOpen,
            searchResults,
            searchQuery,
            collectSearchData,
            handleLayerToggle,
            performSearch,
            openSearchModal,
            closeSearchModal,
        ],
    );

    return searchPanelApi;
};