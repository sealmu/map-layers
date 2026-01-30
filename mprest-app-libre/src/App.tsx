import { useMemo, useState, useCallback } from "react";

import { ViewerProvider, Mmap } from "@mprest/map-core";
// Importing from @mprest/map-maplibre auto-registers the "maplibre" provider
import {
  type AppContentProps,
  type LayeredDataWithPayload,
  type MapClickLocation,
  type MapLibreFeature,
} from "@mprest/map-maplibre";

import { EntityPopup, type EntityPopupInfo } from "./components/popups";
import { PositionInfoBar } from "./components/PositionInfoBar";
import { AppLayers } from "./AppLayers";
import { AppRenderers } from "./AppRenderers";
import { AppPanels } from "./AppPanels";

import { dataSource } from "./data/dataSource";

type AppRenderers = typeof AppRenderers;

type MyDataPayload = {
  x: number;
  y: number;
  z?: number;
  shape?: string;
  config?: {
    center: [number, number, number];
    radius: number;
    angle: number;
  };
};

type AppData = LayeredDataWithPayload<MyDataPayload>;

function App() {
  const data = useMemo<AppData[]>(() => dataSource as AppData[], []);

  return (
    <ViewerProvider>
      <AppContent data={data} renderers={AppRenderers} />
      <AppPanels />
    </ViewerProvider>
  );
}

function AppContent({
  data,
  renderers,
}: AppContentProps<AppRenderers> & { data: AppData[] }) {
  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);

  const handleMapClick = useCallback((
    feature: MapLibreFeature | null,
    location: MapClickLocation
  ): boolean | void => {
    if (feature) {
      setPopupInfo({ feature, location });
    } else {
      setPopupInfo(null);
    }
  }, []);

  const handleSelecting = useCallback((
    feature: MapLibreFeature,
    _location: MapClickLocation
  ): boolean | void => {
    // Cancel selection for polyline entities
    if (feature.geometry?.type === "LineString") {
      return false;
    }
    if (feature.renderType === "polylines" || feature.properties?.rendererType === "polylines") {
      return false;
    }
    return true; // Allow selection for other entities
  }, []);

  const handleClickPrevented = useCallback((
    feature: MapLibreFeature,
    _location: MapClickLocation
  ): boolean | void => {
    // Show popup without location to indicate selection was prevented
    setPopupInfo({ feature });
  }, []);

  const handleSelected = useCallback((
    feature: MapLibreFeature | null,
    location?: MapClickLocation
  ): boolean | void => {
    if (feature) {
      setPopupInfo({ feature, location });
    }
  }, []);

  const handleChangePosition = useCallback((location: MapClickLocation | null): boolean | void => {
    setCurrentPosition(location);
  }, []);

  const layers = useMemo(() => AppLayers(data, renderers), [data, renderers]);

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Mmap
          provider="maplibre"
          renderers={AppRenderers}
          style="https://demotiles.maplibre.org/style.json"
          center={[-98.5795, 39.8283]}
          zoom={4}
          onClick={handleMapClick}
          onSelecting={handleSelecting}
          onClickPrevented={handleClickPrevented}
          onSelected={handleSelected}
          onChangePosition={handleChangePosition}
        >
          {layers}
        </Mmap>

        <EntityPopup
          popupInfo={popupInfo}
          onClose={() => setPopupInfo(null)}
        />

        <PositionInfoBar position={currentPosition} />
      </div>
    </>
  );
}

export default App;
