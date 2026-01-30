import { Layer, applyExtractor } from "@mprest/map-core";
import { createRenderTypes, type RendererRegistry, type LayeredDataWithPayload, type LayerData } from "@mprest/map-cesium";
import { Cartesian2, Color, Entity } from "cesium";

import { extractPoints, extractPolygons, extractDrones, extractMixed, extractCones, extractDomes } from "./helpers/extractors/dataExtractors";
import { getLayersConfig } from "./config/layersConfig";

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

export function AppLayers(data: AppData[], renderers: RendererRegistry) {
  const layersConfig = getLayersConfig();

  const RenderTypes = createRenderTypes(renderers);

  return [
    <Layer
      key="points"
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
    />,
    <Layer
      key="polygons"
      id="polygons"
      name="Polygons"
      type={RenderTypes.POLYGONS}
      data={extractPolygons(data)}
      isActive={false}
      isVisible={true}
      description="Polygon areas"
    />,
    ...layersConfig.map((cfg) => (
      <Layer
        key={cfg.id}
        {...cfg}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data={applyExtractor(data as any, cfg.extractor as any) as unknown as AppData[]}
      />
    )),
    <Layer
      key="drones"
      id="drones"
      name="Drones"
      type={RenderTypes.CUSTOM}
      data={extractDrones(data)}
      isActive={true}
      isVisible={true}
      description="Drone positions with custom renderer"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRenderer={droneRenderer as any}
    />,
    <Layer
      key="mixed"
      id="mixed"
      name="Mixed"
      isDocked={false}
      type={RenderTypes.CUSTOM}
      data={extractMixed(data)}
      isActive={true}
      isVisible={false}
      description="Mixed types and custom renderers"
    />,
    <Layer
      key="dynamic"
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
    />,
    <Layer
      key="dynamic-raw"
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
    />,
    <Layer
      key="cones"
      id="cones"
      name="Cones"
      type={RenderTypes.CONE}
      data={extractCones(data)}
      isDocked={true}
      isActive={false}
      isVisible={true}
      description="Cone shapes"
      group="structures"
      groupName="Structures"
      groupIsDocked={false}
    />,
    <Layer
      key="radar"
      id="radar"
      name="Radar"
      type={RenderTypes.CONE}
      data={extractCones(data)}
      isDocked={true}
      isActive={false}
      isVisible={true}
      description="Radar cones"
      group="structures"
      groupName="Structures"
      groupIsDocked={false}
    />,
    <Layer
      key="domes"
      id="domes"
      name="Domes"
      type={RenderTypes.DOMES}
      data={extractDomes(data)}
      isDocked={true}
      isActive={true}
      isVisible={false}
      description="Circular dome areas"
      group="structures"
      groupName="Structures"
      groupIsDocked={false}
    />,
  ];
}