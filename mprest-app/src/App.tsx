import { useMemo, useState, useCallback, useEffect } from "react";

import { Cartesian2, Color, Entity, Cartesian3 } from "cesium";

import { useDroneAnimation, useDroneAnimation2 } from "./hooks/useDroneAnimation";

import {
  CesiumMap,
  Layer,
  ViewerProvider,
  useViewer,
  createRenderTypes,
  defaultRenderers,
  createPolylineEntity,
  applyExtractor,
  LayersPanel,
  FiltersPanel,
  SearchPanel,
  DataConnector,
} from "@mprest/map";

import DynamicPanel from "./components/DynamicPanel";
import DynamicRawDataPanel from "./components/DynamicRawDataPanel";
import { Expander } from "./components";
import { EntityPopup, type EntityPopupInfo } from "./components/EntityPopup";
import { PositionInfoBar } from "./components/PositionInfoBar";

import type {
  AppContentProps,
  RendererRegistry,
  LayerData,
  LayeredDataWithPayload,
  CesiumMapApi,
  ViewerWithConfigs,
  MapClickLocation,
} from "@mprest/map";

import { dataSource } from "./data/dataSource";

import {
  extractPoints,
  extractPolygons,
  extractDrones,
  extractMixed,
} from "./helpers/extractors/dataExtractors";

import { getLayersConfig } from "./config/layersConfig";

const renderers = {
  ...defaultRenderers,
  polylines: createPolylineEntity,
} as const satisfies RendererRegistry;

type AppRenderers = typeof renderers;
type MyDataPayload = {
  x: number;
  y: number;
  z?: number;
  shape?: string;
};
type AppData = LayeredDataWithPayload<MyDataPayload>;

const RenderTypes = createRenderTypes(renderers);



const dataSourceDynamic = {
  "dynamic-raw": [
    {
      id: "raw1",
      name: "Raw Point 1",
      color: Color.RED,
      positions: [Cartesian3.fromDegrees(-75.0, 40.0, 100.0)],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw2",
      name: "Raw Point 2",
      color: Color.BLUE,
      positions: [Cartesian3.fromDegrees(-76.0, 41.0, 100.0)],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw3",
      name: "Raw Point 3",
      color: Color.GREEN,
      positions: [Cartesian3.fromDegrees(-74.0, 42.0, 100.0)],
      view: "default",
      renderType: "points",
    },
  ] as LayerData[],
};

function DataUpdater(
  data: Record<string, LayerData[]>,
  interval: number = 1000,
) {
  const timerId = setInterval(() => {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const layerArray = data[randomKey];
    if (!layerArray || layerArray.length === 0) return;

    const randomIndex = Math.floor(Math.random() * layerArray.length);

    const randomLon = -125 + Math.random() * 59; // -125 → -66
    const randomLat = 24 + Math.random() * 25;  // 24 → 49

    layerArray[randomIndex].positions = [
      Cartesian3.fromDegrees(randomLon, randomLat, 100.0),
    ];
  }, interval);

  // return a way to stop it
  return () => clearInterval(timerId);
}


(function updateDataFromSocket() {
  DataUpdater(dataSourceDynamic, 500);
})();


const DataConnectorConfig = {
  // fetchInterval: 1000,
  fetchIntervals: {
    "dynamic-raw": 1000,
  },
};


function App() {
  const data = useMemo<AppData[]>(() => dataSource as AppData[], []);

  return (
    <ViewerProvider>
      <AppContent data={data} renderers={renderers} />
    </ViewerProvider>
  );
}


function AppContent({
  data,
  renderers,
}: AppContentProps<AppRenderers> & { data: AppData[] }) {
  const { viewer } = useViewer();
  const layersConfig = useMemo(() => getLayersConfig(), []);
  const [mapApi, setMapApi] = useState<CesiumMapApi | null>(null);
  const [layersPanelDocked, setLayersPanelDocked] = useState(true);
  const [dynamicPanelsDocked, setDynamicPanelsDocked] = useState(true);
  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [popupDimensions] = useState({ width: 350, height: 250 });
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);

  // Calculate popup position to stay within viewport bounds
  const popupPosition = useMemo(() => {
    if (!popupInfo?.location) return null;

    const offset = 10;
    let left = popupInfo.screenPosition!.x + offset;
    let top = popupInfo.screenPosition!.y + offset;

    const popupWidth = popupDimensions.width;
    const popupHeight = popupDimensions.height;

    // Check if positioning to the right would go off-screen
    const wouldOverflowRight = left + popupWidth > window.innerWidth;
    const wouldOverflowBottom = top + popupHeight > window.innerHeight;

    // Adjust position based on available space
    if (wouldOverflowRight) {
      left = popupInfo.screenPosition!.x - popupWidth - offset;
    }

    if (wouldOverflowBottom) {
      top = popupInfo.screenPosition!.y - popupHeight - offset;
    }

    // Ensure popup stays within viewport bounds
    left = Math.max(0, Math.min(left, window.innerWidth - popupWidth));
    top = Math.max(0, Math.min(top, window.innerHeight - popupHeight));

    return { left, top };
  }, [popupInfo, popupDimensions]);

  // const enrichEntity = useCallback((entity: Entity.ConstructorOptions) => {
  //   console.log('Entity is being created', entity);
  //   void entity; // Return null to use default createEntityFromData
  // }, []);

  // const onEntityCreate = useCallback((
  //   type: RenderTypeFromRegistry<RendererRegistry>,
  //   item: LayerData,
  //   _renderers: RendererRegistry,
  //   layerId?: string
  // ) => {
  //   console.log('Entity creation requested:', { type, item, layerId });
  //   return null; // Return null to use default createEntityFromData
  // }, []);

  const handleFilter = () => {
    if (!mapApi) return;
    mapApi.api.filtersPanel.openFilterModal();
  };

  const handleSearch = () => {
    if (!mapApi) return;
    mapApi.api.searchPanel.openSearchModal();
  };

  const handleMapClick = useCallback((entity: Entity | null, location: MapClickLocation, screenPosition?: Cartesian2) => {
    if (entity && screenPosition) {
      setPopupInfo({ entity, location, screenPosition });
    } else {
      //setPopupInfo(null);
    }
  }, []);

  const handleClickPrevented = useCallback((
    entity: Entity,
    //location: MapClickLocation
  ) => {
    setPopupInfo({ entity });
  }, []);

  const handleSelected = useCallback((entity: Entity | null, location?: MapClickLocation, screenPosition?: Cartesian2) => {
    console.log('Entity onSelected(on prop):', {
      entityId: entity?.id ?? 'none',
      location,
      screenPosition,
    });
    if (entity) {
      setPopupInfo({ entity, location, screenPosition });
    } else {
      //setPopupInfo(null);
    }
  }, []);

  const handleSelecting = useCallback((
    entity: Entity,
    //location: MapClickLocation
  ) => {
    // Cancel selection for polyline entities
    if (entity.polyline) {
      return false; // Cancel selection for polylines
    }
    return true; // Allow selection for other entities
  }, []);

  // const handleEntityChange = useCallback((entity: Entity, status: EntityChangeStatus, collectionName: string) => {
  //   console.log('Entity changed:', { entityId: entity.id, status, collectionName });
  // }, []);

  const handleChangePosition = useCallback((location: MapClickLocation | null) => {
    setCurrentPosition(location);
  }, []);

  useDroneAnimation(viewer as ViewerWithConfigs, {
    droneId: "drone2",
    centerLon: -104.99,
    centerLat: 39.7392,
    radius: 1.5,
    baseAlt: 320,
    altAmp: 12,
    segments: 64,
    orbitDurationMs: 20000,
  });

  useDroneAnimation2(viewer as ViewerWithConfigs);

  // Subscribe to onSelected event from viewer
  useEffect(() => {
    if (!viewer) return;

    const unsubscribe = viewer.handlers.onSelected.subscribe((entity, location, screenPosition) => {
      console.log('Entity onSelected(viewer):', {
        entityId: entity?.id ?? 'none',
        location,
        screenPosition,
      });
    });

    return unsubscribe;
  }, [viewer]);

  // Subscribe to onEntityChange event from viewer
  // useEffect(() => {
  //   if (!viewer) return;

  //   const unsubscribe = viewer.handlers.onEntityChange.subscribe((entity, status, collectionName) => {
  //     console.log('Entity onEntityChange(viewer):', {
  //       entityId: entity.id,
  //       status,
  //       collectionName,
  //     });
  //   });

  //   return unsubscribe;
  // }, [viewer]);

  return (
    <>
      <CesiumMap
        // onEntityCreating={enrichEntity}
        // onEntityCreate={onEntityCreate}
        renderers={renderers}
        animateActivation={true}
        animateVisibility={true}
        onApiReady={setMapApi}
        // onEntityChange={handleEntityChange}
        onClick={handleMapClick}
        onSelecting={handleSelecting}
        onClickPrevented={handleClickPrevented}
        onSelected={handleSelected}
        onChangePosition={handleChangePosition}
      >
        <Layer
          id="points"
          name="Points"
          type={RenderTypes.POINTS}
          data={extractPoints(data)}
          isActive={true}
          isVisible={false}
          description="Point markers on the map"
          group="basic-shape"
          groupName="Basic Shapes"
          groupIsDocked={false}
        />
        <Layer
          id="polygons"
          name="Polygons"
          type={RenderTypes.POLYGONS}
          data={extractPolygons(data)}
          isActive={false}
          isVisible={true}
          description="Polygon areas"
        />
        {layersConfig.map((cfg) => (
          <Layer
            key={cfg.id}
            {...cfg}
            data={applyExtractor(data, cfg.extractor) as AppData[]}
          />
        ))}
        <Layer
          id="drones"
          name="Drones"
          type={RenderTypes.CUSTOM}
          data={extractDrones(data)}
          isActive={true}
          isVisible={true}
          description="Drone positions with custom renderer"
          customRenderer={droneRenderer}
        />
        <Layer
          id="mixed"
          name="Mixed"
          isDocked={false}
          type={RenderTypes.CUSTOM}
          data={extractMixed(data)}
          isActive={true}
          isVisible={false}
          description="Mixed types and custom renderers"
        />
        <Layer
          id="dynamic"
          name="dynamic"
          isDocked={true}
          type={RenderTypes.CUSTOM}
          data={[]}
          isActive={false}
          isVisible={true}
          description="Dynamic layer updated externally"
          group="dynamic"
          groupName="Dynamic"
          groupIsDocked={false}
        />
        <Layer
          id="dynamic-raw"
          name="Dynamic Raw"
          isDocked={true}
          type={RenderTypes.CUSTOM}
          data={[]}
          isActive={true}
          isVisible={true}
          description="Dynamic raw data layer updated externally"
          group="dynamic"
          groupName="Dynamic"
          groupIsDocked={false}
        />
      </CesiumMap>

      <EntityPopup
        popupInfo={popupInfo}
        popupPosition={popupPosition}
        onClose={() => setPopupInfo(null)}
      />

      <PositionInfoBar position={currentPosition} />

      <DataConnector dataSource={dataSourceDynamic} config={DataConnectorConfig} />



      {mapApi && <FiltersPanel api={mapApi.api.filtersPanel} />}

      {mapApi && <SearchPanel api={mapApi.api} />}

      <Expander
        title="Simulations"
        position="right"
        size="content"
        isDocked={dynamicPanelsDocked}
        onToggle={setDynamicPanelsDocked}
      >
        <div className="dynamic-panels-container" style={{ marginLeft: "10px", marginTop: "10px" }}>
          <div style={{ marginRight: "20px" }}>
            <DynamicPanel renderers={renderers} />
          </div>
          <div style={{ marginRight: "20px" }}>
            <DynamicRawDataPanel />
          </div>

        </div>
      </Expander>

      {mapApi && (
        <Expander
          title="Layers"
          position="bottom"
          size="full"
          isDocked={layersPanelDocked}
          onToggle={setLayersPanelDocked}
        >
          <div style={{ marginTop: "8px", marginBottom: "15px", marginLeft: "12px", marginRight: "12px" }}>
            <LayersPanel api={mapApi.api.layersPanel} onFilter={handleFilter} onSearch={handleSearch} />
          </div>
        </Expander>
      )}
    </>
  );
}

export default App;

function droneRenderer(item: LayerData): Entity.ConstructorOptions {
  return {
    id: item.id,
    name: item.name,
    position: item.positions[0],
    point: {
      pixelSize: 1,
      color: item.color,
      outlineColor: Color.WHITE,
      outlineWidth: 3,
    },
    label: {
      text: "🚁",
      font: "36px sans-serif",
      fillColor: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cartesian2(0, -25),
      style: 0,
    },
  };
}
