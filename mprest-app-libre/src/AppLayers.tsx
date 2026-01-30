import { Layer, applyExtractor } from "@mprest/map-core";
import { createRenderTypes, toMapLibreColor, type RendererRegistry, type LayeredDataWithPayload, type LayerData, type MapLibreFeature } from "@mprest/map-maplibre";

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

// SVG drone icon (quadcopter shape)
const droneIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <!-- Body -->
  <rect x="12" y="12" width="8" height="8" rx="2" fill="#333333" stroke="#ffffff" stroke-width="1"/>
  <!-- Arms -->
  <line x1="14" y1="14" x2="6" y2="6" stroke="#555555" stroke-width="2"/>
  <line x1="18" y1="14" x2="26" y2="6" stroke="#555555" stroke-width="2"/>
  <line x1="14" y1="18" x2="6" y2="26" stroke="#555555" stroke-width="2"/>
  <line x1="18" y1="18" x2="26" y2="26" stroke="#555555" stroke-width="2"/>
  <!-- Rotors -->
  <circle cx="6" cy="6" r="4" fill="#ff4444" stroke="#ffffff" stroke-width="1"/>
  <circle cx="26" cy="6" r="4" fill="#ff4444" stroke="#ffffff" stroke-width="1"/>
  <circle cx="6" cy="26" r="4" fill="#ff4444" stroke="#ffffff" stroke-width="1"/>
  <circle cx="26" cy="26" r="4" fill="#ff4444" stroke="#ffffff" stroke-width="1"/>
</svg>`;
const droneIconData = `data:image/svg+xml;base64,${btoa(droneIconSvg)}`;

function droneRenderer(item: LayerData): MapLibreFeature {
  const pos = item.positions[0];
  return {
    type: "Feature",
    id: item.id,
    geometry: {
      type: "Point",
      coordinates: [pos.longitude, pos.latitude],
    },
    properties: {
      id: item.id,
      name: item.name,
      icon: "drone-marker",
      iconData: droneIconData,
      iconSize: 1,
      pointColor: "rgba(0,0,0,0)",
      pointSize: 0,
      labelText: item.name,
      rendererType: "drone",
      show: true,
    },
  };
}

// Mixed renderer that delegates to the appropriate renderer based on item.renderType or customRenderer
function createMixedRenderer(renderers: RendererRegistry) {
  return (item: LayerData): MapLibreFeature => {
    // Check if item has its own customRenderer first
    if (item.customRenderer) {
      return item.customRenderer(item);
    }

    // Use renderType to find renderer from registry
    const renderType = item.renderType || "points";
    const renderer = renderers[renderType];
    if (renderer) {
      return renderer(item);
    }

    // Fallback to basic point
    const pos = item.positions[0];
    return {
      type: "Feature",
      id: item.id,
      geometry: {
        type: "Point",
        coordinates: [pos.longitude, pos.latitude],
      },
      properties: {
        id: item.id,
        name: item.name,
        pointColor: toMapLibreColor(item.color),
        pointSize: 10,
        show: true,
      },
    };
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
    />,
    <Layer
      key="polygons"
      id="polygons"
      name="Polygons"
      type={RenderTypes.POLYGONS}
      data={extractPolygons(data)}
      isActive={true}
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRenderer={createMixedRenderer(renderers) as any}
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
