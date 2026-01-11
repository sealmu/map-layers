import { useMemo, useState } from "react";

import { Cartesian2, Color, Entity, Cartesian3 } from "cesium";

import { useDroneAnimation } from "./hooks/useDroneAnimation";

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
  DataConnector,
} from "@mprest/map";

import DynamicPanel from "./components/DynamicPanel";
import DynamicRawDataPanel from "./components/DynamicRawDataPanel";

import type {
  AppContentProps,
  RendererRegistry,
  LayerData,
  LayeredDataWithPayload,
  CesiumMapApi,
  ViewerWithConfigs,
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

  return (
    <>
      <CesiumMap
        renderers={renderers}
        animateActivation={true}
        animateVisibility={true}
        onApiReady={setMapApi}
      >
        <Layer
          id="points"
          name="Points"
          type={RenderTypes.POINTS}
          data={extractPoints(data)}
          isActive={true}
          isVisible={false}
          description="Point markers on the map"
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
          isVisible={false}
          description="Drone positions with custom renderer"
          customRenderer={droneRenderer}
        />
        <Layer
          id="mixed"
          name="Mixed"
          isDocked={true}
          type={RenderTypes.CUSTOM}
          data={extractMixed(data)}
          isActive={false}
          isVisible={true}
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
        />
        <Layer
          id="dynamic-raw"
          name="dynamic-raw"
          isDocked={false}
          type={RenderTypes.CUSTOM}
          data={[]}
          isActive={true}
          isVisible={true}
          description="Dynamic raw data layer updated externally"
        />
      </CesiumMap>

      <DataConnector dataSource={dataSourceDynamic} config={{ fetchInterval: 1000 }} />

      {mapApi && <LayersPanel api={mapApi.api.layersPanel} />}

      <div className="dynamic-panels-container">
        <DynamicPanel renderers={renderers} />
        <DynamicRawDataPanel />
      </div>
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
