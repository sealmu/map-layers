import { useMemo, useState } from "react";
import { Cartesian2, Color, Entity } from "cesium";
import {
  CesiumMap,
  Layer,
  LayersPanel,
  ViewerProvider,
  type CesiumMapApi,
  type LayerData,
  type LayeredDataWithPayload,
  type RendererRegistry,
  createRenderTypes,
  defaultRenderers,
  createPolylineEntity,
  applyExtractor,
  useViewer,
} from "@mprest/map";
import { useDroneAnimation } from "./hooks/useDroneAnimation";
import { dataSource } from "./data/dataSource";
import {
  extractPoints,
  extractPolygons,
  extractDrones,
  extractMixed,
} from "./helpers/extractors/dataExtractors";
import { getLayersConfig } from "./config/layersConfig";

import "../../src/styles/App.css";
import "./styles/CesiumMap.css";
import "./styles/LayerControl.css";

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
}: {
  data: AppData[];
  renderers: AppRenderers;
}) {
  const { viewer } = useViewer();
  const layersConfig = useMemo(() => getLayersConfig(), []);
  const [mapApi, setMapApi] = useState<CesiumMapApi | null>(null);

  useDroneAnimation(viewer, {
    droneId: "drone2",
    centerLon: -105.0,
    centerLat: 40.0,
    radius: 1.5,
    baseAlt: 250,
    altAmp: 12,
    segments: 64,
    orbitDurationMs: 20000,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1 }}>
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
            isVisible={true}
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
            isVisible={true}
            description="Drone positions with custom renderer"
            customRenderer={droneRenderer}
          />
          <Layer
            id="mixed"
            name="Mixed"
            type={RenderTypes.CUSTOM}
            data={extractMixed(data)}
            isActive={false}
            isVisible={true}
            description="Mixed types and custom renderers"
          />
        </CesiumMap>
      </div>
      <div style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>
        {mapApi && <LayersPanel api={mapApi.api.layersPanel} />}
      </div>
    </div>
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
