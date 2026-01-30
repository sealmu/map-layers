import { useState, useLayoutEffect } from "react";

import { useViewer, FiltersPanel, SearchPanel, LayersPanel, type IMapApi } from "@mprest/map-core";
import type { MapApi } from "@mprest/map-maplibre";

import { Expander } from "./components";

export function AppPanels() {
  const { viewer } = useViewer();
  const [api, setApi] = useState<IMapApi | undefined>(undefined);

  const [layersPanelDocked, setLayersPanelDocked] = useState(true);

  // Subscribe to API changes from viewer and read initial value
  useLayoutEffect(() => {
    if (!viewer) return;

    if (!viewer.handlers?.onApiChange) return;

    const unsubscribe = viewer.handlers.onApiChange.subscribe((newApi) => {
      setApi(newApi);
    });

    return unsubscribe;
  }, [viewer]);

  const handleFilter = () => {
    if (!api) return;
    api.filters.openFilterModal();
  };

  const handleSearch = () => {
    if (!api) return;
    api.search.openSearchModal();
  };

  if (!viewer || !api) return null;
  return (
    <>
      <FiltersPanel api={api.filters} />
      <SearchPanel api={api.search} filters={api.filters} entities={(api as MapApi).entities} />

      <Expander
        title="Layers"
        position="bottom"
        size="full"
        isDocked={layersPanelDocked}
        onToggle={setLayersPanelDocked}
      >
        <div style={{ marginTop: "8px", marginBottom: "15px", marginLeft: "12px", marginRight: "12px" }}>
          <LayersPanel api={api.layers} onFilter={handleFilter} onSearch={handleSearch} />
        </div>
      </Expander>
    </>
  );
}
