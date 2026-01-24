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
import { AppRenderers } from "./AppRenderers";

export function AppPanels() {
  const { viewer } = useViewer();
  const [api, setApi] = useState<MapApi | undefined>(undefined);

  const [layersPanelDocked, setLayersPanelDocked] = useState(true);
  const [dynamicPanelsDocked, setDynamicPanelsDocked] = useState(true);

  // Subscribe to API changes from viewer
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
    api.filtersPanel.openFilterModal();
  };

  const handleSearch = () => {
    if (!api) return;
    api.searchPanel.openSearchModal();
  };

  if (!viewer || !api) return null;
  return (
    <>
      <FiltersPanel api={api.filtersPanel} />
      <SearchPanel api={api.searchPanel} filtersPanel={api.filtersPanel} entities={api.entities} />
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
          <LayersPanel api={api.layersPanel} onFilter={handleFilter} onSearch={handleSearch} />
        </div>
      </Expander>
    </>
  );
}