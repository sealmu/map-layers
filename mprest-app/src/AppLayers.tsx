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
    // point: {
    //   pixelSize: 10,
    //   color: item.color,
    //   outlineColor: Color.WHITE,
    //   outlineWidth: 3,
    // },
    // billboard: {
    //   image: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 52"><path d="M6 42 L6 46 L70 46 L70 42 Q70 38 66 38 L10 38 Q6 38 6 42 Z" fill="#fff"/><circle cx="14" cy="44" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="14" cy="44" r="2" fill="#fff"/><circle cx="28" cy="44" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="44" r="2" fill="#fff"/><circle cx="42" cy="44" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="42" cy="44" r="2" fill="#fff"/><circle cx="56" cy="44" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="56" cy="44" r="2" fill="#fff"/><rect x="8" y="48" width="60" height="3" rx="1" fill="#fff"/><path d="M12 38 L12 28 Q12 24 16 24 L52 24 Q56 24 56 28 L56 38 Z" fill="#fff"/><path d="M20 24 L24 16 L48 16 L52 24 Z" fill="#fff"/><rect x="26" y="12" width="20" height="6" rx="1" fill="#fff"/><rect x="44" y="14" width="32" height="4" rx="1" fill="#fff"/><rect x="74" y="12" width="6" height="8" rx="1" fill="#fff"/><rect x="76" y="14" width="1" height="4" fill="none" stroke="#fff" stroke-width="0.5"/><rect x="78" y="14" width="1" height="4" fill="none" stroke="#fff" stroke-width="0.5"/><rect x="16" y="18" width="6" height="6" fill="#fff"/><circle cx="19" cy="21" r="2" fill="none" stroke="#fff" stroke-width="1"/></svg>`),
    //   color: item.color as Color,
    //   width: 32,
    //   height: 32,
    //   pixelOffset: new Cartesian2(0, 0),
    // },
    label: {
      text: "🚁",
      font: "36px sans-serif",
      fillColor: item.color,
      outlineColor: Color.BLACK,
      outlineWidth: 0,
      pixelOffset: new Cartesian2(0, 0),
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
      isVisible={true}
      description="Point markers on the map"
      group="basic-shape"
      groupName="Basic Shapes"
      groupIsDocked={false}
      isDisplayed={true}
      isEnabled={true}
      filterConfig={{
        isDisplayed: true,
        isEnabled: true,
        types: {
          points: {
            isDisplayed: true,
            isHidden: false,
            initialVisibility: true
          }
        }
      }}
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
      isVisible={true}
      description="Mixed types and custom renderers"
      onEntityCreating={(options, item) => {
        void options;
        void item;
        //console.log('Creating entity for mixed layer:', { id: options.id, renderType: item.renderType, item });
        // if (item.renderType === 'polygons') {
        //   return false; // Skip creating polygons in mixed layer
        // }
      }}
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