import { useState, useLayoutEffect } from "react";

import {
  useViewer,
  FiltersPanel,
  SearchPanel,
  LayersPanel,
  type MapApi,
} from "@mprest/map";

import { Expander } from "./components";
import DynamicPanel from "./components/DynamicPanel";
import DynamicRawDataPanel from "./components/DynamicRawDataPanel";
import { BookmarksPanel } from "./components/BookmarksPanel";
import { AppRenderers } from "./AppRenderers";

export function AppPanels() {
  const { viewer } = useViewer();
  const [api, setApi] = useState<MapApi | undefined>(undefined);

  const [layersPanelDocked, setLayersPanelDocked] = useState(true);
  const [dynamicPanelsDocked, setDynamicPanelsDocked] = useState(true);
  const [bookmarksPanelDocked, setBookmarksPanelDocked] = useState(true);

  // Subscribe to API changes from viewer and read initial value
  useLayoutEffect(() => {
    if (!viewer) return;

    // Read current API immediately (in case it was already set before this component mounted)
    if (viewer.api) {
      setApi(viewer.api);
    }

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
      <SearchPanel api={api.search} filters={api.filters} entities={api.entities} />
      <Expander
        title="Simulations"
        position="right"
        size="content"
        isDocked={dynamicPanelsDocked}
        onToggle={setDynamicPanelsDocked}
      >
        <div className="dynamic-panels-container" style={{ marginLeft: "10px", marginTop: "10px" }}>
          <div style={{ marginRight: "20px" }}>
            <DynamicPanel renderers={AppRenderers} />
          </div>
          <div style={{ marginRight: "20px" }}>
            <DynamicRawDataPanel />
          </div>
        </div>
      </Expander>

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

      <Expander
        title="Bookmarks"
        position="left"
        size="content"
        isDocked={bookmarksPanelDocked}
        onToggle={setBookmarksPanelDocked}
      >
        <BookmarksPanel api={api} />
      </Expander>
    </>
  );
}