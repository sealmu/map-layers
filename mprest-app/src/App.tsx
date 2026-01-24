import { useMemo, useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { Cartesian2, Color, Entity, Cartesian3, Cartographic, ConstantProperty, PolygonHierarchy, ColorMaterialProperty } from "cesium";

import { useDroneAnimation, useDroneAnimation2 } from "./hooks/useDroneAnimation";
import { useRadarAnimation } from "./hooks/useRadarAnimation";
import { useDroneTargetAnimation } from "./hooks/useDroneTargetAnimation";

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
  type MapApi,
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
  ViewerWithConfigs,
  MapClickLocation,
} from "@mprest/map";

import { dataSource } from "./data/dataSource";

import {
  extractPoints,
  extractPolygons,
  extractDrones,
  extractMixed,
  extractCones,
  extractDomes,
} from "./helpers/extractors/dataExtractors";

import { getLayersConfig } from "./config/layersConfig";

import { EntitySelectionPlugin } from "./plugins/EntitySelectionPlugin";

const renderers = {
  ...defaultRenderers,
  polylines: createPolylineEntity,
  cone: createConeEntity,
} as const satisfies RendererRegistry;

type AppRenderers = typeof renderers;
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
      <AppPanels />
    </ViewerProvider>
  );
}


function AppPanels() {
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
            <DynamicPanel renderers={renderers} />
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


function AppContent({
  data,
  renderers,
}: AppContentProps<AppRenderers> & { data: AppData[] }) {
  const { viewer } = useViewer();

  const layersConfig = useMemo(() => getLayersConfig(), []);

  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [popupDimensions] = useState({ width: 350, height: 250 });
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [selectionSourceEntity, setSelectionSourceEntity] = useState<Entity | undefined>(undefined);

  const pluginsSubscribedRef = useRef(false);

  // Drone target animation
  const { state: animationState, controls: animationControls } = useDroneTargetAnimation(
    viewer as ViewerWithConfigs,
    {
      durationMs: 5000,
      onComplete: (sourceId, targetId) => {
        console.log(`Animation complete: ${sourceId} reached ${targetId}`);
      },
    },
  );

  const plugins = useMemo(() => ({ entitySelection: EntitySelectionPlugin }), []);

  // Subscribe to plugin events
  useEffect(() => {
    if (!viewer || !viewer.plugins || pluginsSubscribedRef.current) return;

    const plugin = viewer.plugins['entitySelection'] as EntitySelectionPlugin;
    if (!plugin) return;

    pluginsSubscribedRef.current = true;

    const unsubscribeSource = plugin.events.onEntitySource.subscribe((entity) => {
      console.log('onEntitySource:', entity.id);
      // For example, enter selection mode for certain entities
      if (entity.id?.toString().includes('drone')) {
        return true; // Enter selection mode
      }
      return false;
    });

    const unsubscribeTarget = plugin.events.onEntityTarget.subscribe((entity) => {
      console.log('onEntityTarget:', entity.id);
      // For example, only allow selecting points as targets
      if (entity.id?.toString().includes('point')) {
        return true; // Allow this target
      }
      return false; // Reject this target
    });

    const unsubscribeSet = plugin.events.onTargetSet.subscribe((source, target) => {
      console.log('onTargetSet:', source.id, '->', target.id);
      // Start drone animation when target is set
      animationControls.startAnimation(source, target);
    });

    const unsubscribeSelectionChanged = plugin.events.onSelectionChanged.subscribe((isActive, sourceEntity) => {
      console.log('Selection mode changed:', isActive, sourceEntity?.id);
      setSelectionModeActive(isActive);
      setSelectionSourceEntity(sourceEntity);
    });

    return () => {
      unsubscribeSource();
      unsubscribeTarget();
      unsubscribeSet();
      unsubscribeSelectionChanged();
      pluginsSubscribedRef.current = false;
    };
  }, [viewer, animationControls]);

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

  const handleMapClick = useCallback((entity: Entity | null, location: MapClickLocation, screenPosition?: Cartesian2): boolean | void => {
    if (entity && screenPosition) {
      setPopupInfo({ entity, location, screenPosition });
    } else {
      //setPopupInfo(null);
    }
  }, []);

  const handleClickPrevented = useCallback((
    entity: Entity,
    //location: MapClickLocation
  ): boolean | void => {
    setPopupInfo({ entity });
  }, []);

  const handleSelected = useCallback((entity: Entity | null, location?: MapClickLocation, screenPosition?: Cartesian2): boolean | void => {
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
  ): boolean | void => {
    // Cancel selection for polyline entities
    if (entity.polyline) {
      return false; // Cancel selection for polylines
    }
    return true; // Allow selection for other entities
  }, []);

  // const handleEntityChange = useCallback((entity: Entity, status: EntityChangeStatus, collectionName: string) => {
  //   console.log('Entity changed:', { entityId: entity.id, status, collectionName });
  // }, []);

  const handleChangePosition = useCallback((location: MapClickLocation | null): boolean | void => {
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

  useRadarAnimation(viewer as ViewerWithConfigs, "radar1");


  // Subscribe to onSelected event from viewer
  useEffect(() => {
    if (!viewer || !viewer.handlers) return;

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

  //console.log('App render');

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100vh', cursor: selectionModeActive ? 'crosshair' : 'default' }}>
        <CesiumMap
          // onEntityCreating={enrichEntity}
          // onEntityCreate={onEntityCreate}
          renderers={renderers}
          animateActivation={true}
          animateVisibility={true}
          // onApiReady={handleApiReady}
          // onEntityChange={handleEntityChange}
          onClick={handleMapClick}
          onSelecting={handleSelecting}
          onClickPrevented={handleClickPrevented}
          onSelected={handleSelected}
          onChangePosition={handleChangePosition}
          plugins={plugins}
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
          <Layer
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
          />
          <Layer
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
          />
        </CesiumMap>

        {selectionModeActive && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '2px solid #007bff',
            }}
          >
            <div style={{ marginBottom: '5px', fontSize: '16px' }}>
              🎯 Selection Mode Active
            </div>
            <div style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'normal' }}>
              Source: {selectionSourceEntity?.id || 'Unknown'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
              Click on a target entity to complete selection
            </div>
            <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.8 }}>
              Click on empty space to cancel
            </div>
          </div>
        )}

        {animationState.isAnimating && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 100, 0, 0.9)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '10px',
              textAlign: 'center',
              zIndex: 1001,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              fontSize: '14px',
              fontWeight: 'bold',
              border: '2px solid #00ff00',
              minWidth: '250px',
            }}
          >
            <div style={{ marginBottom: '8px', fontSize: '18px' }}>
              Drone in Flight
            </div>
            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'normal' }}>
              {animationState.sourceId} → {animationState.targetId}
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${animationState.progress * 100}%`,
                  height: '100%',
                  backgroundColor: '#00ff00',
                  borderRadius: '4px',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'normal' }}>
              {Math.round(animationState.progress * 100)}% complete
            </div>
            <button
              onClick={animationControls.stopAnimation}
              style={{
                marginTop: '10px',
                padding: '5px 15px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel Flight
            </button>
          </div>
        )}

        <EntityPopup
          popupInfo={popupInfo}
          popupPosition={popupPosition}
          onClose={() => setPopupInfo(null)}
        />

        <PositionInfoBar position={currentPosition} />

        {viewer && <DataConnector dataSource={dataSourceDynamic} config={DataConnectorConfig} />}
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

function createConeEntity(item: LayerData): Entity.ConstructorOptions {
  type ConeItemData = {
    data?: {
      config?: {
        center: [number, number, number];
        radius: number;
        coneAngle: number;
      };
    };
  };

  const config = (item as ConeItemData).data?.config;
  let apex: Cartesian3;
  let coneAngleRadians: number;
  let range: number;

  if (config) {
    const [lon, lat, alt] = config.center;
    apex = Cartesian3.fromDegrees(lon, lat, alt);
    coneAngleRadians = config.coneAngle; // semi-angle
    range = config.radius; // max range/distance
  } else {
    // Fallback to defaults
    apex = item.positions[0];
    coneAngleRadians = Math.PI / 4; // 45 degrees semi-angle
    range = 1500000; // meters
  }

  const carto = Cartographic.fromCartesian(apex);
  const numSides = 2;

  // Create a cone that extends outward from the radar
  // For simplicity, let's create a triangular wedge
  const positions: Cartesian3[] = [apex];

  for (let i = 0; i < numSides; i++) {
    const angle = coneAngleRadians * (i * 2 - 1); // -coneAngleRadians to +coneAngleRadians
    // Calculate point at range distance
    const deltaLon = (range / 6371000) * Math.cos(angle) / Math.cos(carto.latitude);
    const deltaLat = (range / 6371000) * Math.sin(angle);
    const lon = carto.longitude + deltaLon;
    const lat = carto.latitude + deltaLat;
    const alt = 0; // Ground level for better visibility
    const pos = Cartesian3.fromRadians(lon, lat, alt);
    positions.push(pos);
  }
  // Close the polygon
  positions.push(apex);

  return {
    id: item.id,
    name: item.name,
    position: apex,
    point: {
      pixelSize: 10,
      color: Color.BLACK,
    },
    polygon: {
      hierarchy: new ConstantProperty(new PolygonHierarchy(positions)),
      material: new ColorMaterialProperty(new Color(1.0, 1.0, 0.0, 0.5)), // Semi-transparent yellow
      outline: true,
      outlineColor: item.color,
    },
  };
}
