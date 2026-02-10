import { useMemo, useState, useCallback, useEffect, useRef } from "react";

import { Cartesian2, Entity, JulianDate, OpenStreetMapImageryProvider, UrlTemplateImageryProvider } from "cesium";

import { useDroneAnimation, useDroneAnimation2 } from "./hooks/useDroneAnimation";
import { useRadarAnimation } from "./hooks/useRadarAnimation";
import { useDroneTargetAnimation } from "./hooks/useDroneTargetAnimation";

import { Mmap, type LogEntry, type IMapConfig } from "@mprest/map-core";
import {
  ViewerProvider,
  DataConnector,
  useCesiumViewer,
  EntitySelectionPlugin,
  type AppContentProps,
  type LayerData,
  type LayeredDataWithPayload,
  type MapClickLocation,
  type BaseMapProviderConfig,
  type ClusterBillboardId,
  DblClickAction,
} from "@mprest/map-cesium";

import { EntityPopup, type EntityPopupInfo, StickyPopups, usePopupPosition } from "./components/popups";
import { SelectionOverlay, FlightOverlay } from "./components/overlays";
import { PositionInfoBar } from "./components/PositionInfoBar";
import { SelectionPanel } from "./components/SelectionPanel";
import { ClusterTooltip } from "./components/ClusterTooltip";
import { Toast, type ToastRef } from "./components/Toast";
import { createClusterCanvas } from "./utils/clusterCanvas";
import { AppLayers } from "./AppLayers";
import { AppRenderers } from "./AppRenderers";
import { AppPanels } from "./AppPanels";
import { dataSourceDynamic } from "./AppData";

import { dataSource } from "./data/dataSource";

import { StickyInfoPlugin, type StickyEntityInfo } from "./plugins/StickyInfoPlugin";
import {
  TracerPlugin,
  // type EntityTrace
} from "./plugins/TracerPlugin";

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



const DataConnectorConfig = {
  // fetchInterval: 1000,
  fetchIntervals: {
    "dynamic-raw": 1000,
  },
};

// Multi-select configuration (module-level constant for referential stability)
const multiSelectConfig = { isEnabled: true, selectionTool: true, modifier: "shift" as const, dblClickAction: DblClickAction.SELECT_BY_LAYER };

// Clustering configuration (global for all layers)
const clusteringConfig = {
  global: { enabled: true, pixelRange: 40, minimumClusterSize: 2 },
};

// Initial map view configuration (centered on US where entities are located)
const mapConfig: IMapConfig = {
  center: {
    longitude: -98.5795,
    latitude: 39.8283,
    height: 8000000,
  },
  animationDuration: 2,
};

// Base map providers configuration
const baseMapProviders: BaseMapProviderConfig[] = [
  {
    id: "osm",
    name: "OpenStreetMap",
    provider: new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
    }),
    isEnabled: true,
    isListed: true,
    description: "Standard OpenStreetMap tiles",
    onEnabling: (config, viewer) => {
      console.log("About to enable:", config.id, viewer);
    },
  },
  {
    id: "opentopomap",
    name: "OpenTopoMap",
    provider: new UrlTemplateImageryProvider({
      url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
      credit: "OpenTopoMap",
    }),
    isEnabled: false,
    isListed: true,
    description: "Topographic map tiles",
    onEnabling: (config, viewer) => {
      console.log("About to enable:", config.id, viewer);
    },
  },
  {
    id: "stamen-terrain",
    name: "Stamen Terrain",
    provider: new UrlTemplateImageryProvider({
      url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png",
      credit: "Stamen Terrain via Stadia Maps",
    }),
    isEnabled: false,
    isListed: true,
    description: "Terrain with labels and shading",
  },
  {
    id: "nasa-modis",
    name: "NASA MODIS",
    provider: new UrlTemplateImageryProvider({
      url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
      credit: "NASA EOSDIS GIBS",
    }),
    isEnabled: false,
    isListed: true,
    description: "NASA satellite true color imagery",
  },
];


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
  const { viewer } = useCesiumViewer();


  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [popupDimensions] = useState({ width: 350, height: 250 });
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [selectionSourceEntity, setSelectionSourceEntity] = useState<Entity | undefined>(undefined);
  const [stickyInfoMap, setStickyInfoMap] = useState<Map<string, StickyEntityInfo>>(new Map());

  const pluginsSubscribedRef = useRef(false);
  const stickyInfoSubscribedRef = useRef(false);
  const tracerSubscribedRef = useRef(false);
  // const [tracerInfo, setTracerInfo] = useState<Map<string, EntityTrace>>(new Map());

  // Drone target animation
  const { state: animationState, controls: animationControls } = useDroneTargetAnimation(
    viewer,
    {
      durationMs: 5000,
      onComplete: (sourceId, targetId) => {
        console.log(`Animation complete: ${sourceId} reached ${targetId}`);
      },
    },
  );

  const plugins = useMemo(() => ({
    entitySelection: EntitySelectionPlugin,
    stickyInfo: StickyInfoPlugin,
    tracer: TracerPlugin,
  }), []);

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

  // Subscribe to StickyInfo plugin events
  useEffect(() => {
    if (!viewer || !viewer.plugins || stickyInfoSubscribedRef.current) return;

    const plugin = viewer.plugins['stickyInfo'] as StickyInfoPlugin;
    if (!plugin) return;

    stickyInfoSubscribedRef.current = true;

    // Define which entities can have sticky info
    const unsubscribeSource = plugin.events.onEntitySource.subscribe((entity) => {
      // For example, only drones can have sticky info that follows them
      return entity.id?.toString().includes('drone') ?? false;
    });

    // Handle render updates (called on click and when entity moves)
    const unsubscribeRender = plugin.events.onRender.subscribe((info, entityId) => {
      if (info === null) {
        // Entity was closed, remove from map
        setStickyInfoMap(prev => {
          const next = new Map(prev);
          next.delete(entityId);
          return next;
        });
        return;
      }
      // Modify isSticky based on entity ID
      const modifiedInfo = {
        ...info,
        isSticky: !entityId.includes('drone2'),
      };
      setStickyInfoMap(prev => {
        const next = new Map(prev);
        next.set(entityId, modifiedInfo);
        return next;
      });
    });

    return () => {
      unsubscribeSource();
      unsubscribeRender();
      stickyInfoSubscribedRef.current = false;
    };
  }, [viewer]);

  // Subscribe to Tracer plugin events and start tracing drone2
  useEffect(() => {
    if (!viewer || !viewer.plugins || tracerSubscribedRef.current) return;

    const plugin = viewer.plugins['tracer'] as TracerPlugin;
    if (!plugin) return;

    tracerSubscribedRef.current = true;

    // Subscribe to trace changes
    // const unsubscribeChange = plugin.events.onChange.subscribe((entityId, trace) => {
    //   setTracerInfo(prev => {
    //     const next = new Map(prev);
    //     if (trace === null) {
    //       next.delete(entityId);
    //     } else {
    //       next.set(entityId, trace);
    //     }
    //     return next;
    //   });
    //   // Log trace updates for demo
    //   if (trace) {
    //     console.log(`Tracer: ${entityId} has ${trace.coordinates.length} trace points`);
    //   }
    // });

    // Trace config - only override what you need, rest uses defaults
    const traceConfig = {
      maxCoordinates: 5000,
      coordinateLifetime: 20000, // 20 seconds (default: 60000)
    };

    // Function to start tracing drone1
    const startTracingDrone1 = () => {
      const drone1Entity = viewer.api.entities.findEntity('drone1');
      if (drone1Entity) {
        plugin.actions.trace(drone1Entity, traceConfig);
        console.log('Started tracing drone1');
        return true;
      }
      return false;
    };

    // Try to start tracing immediately
    if (!startTracingDrone1()) {
      // If drone1 not found yet, subscribe to entity changes and wait for it
      const unsubscribeEntityChange = viewer.handlers.onEntityChange.subscribe(
        (entity, status) => {
          if (status === 'added' && entity.id === 'drone1') {
            // Use the entity directly from the event instead of findEntity
            plugin.actions.trace(entity, traceConfig);
            console.log('Started tracing drone1 (from added event)');
            unsubscribeEntityChange();
          }
        }
      );

      return () => {
        //unsubscribeChange();
        unsubscribeEntityChange();
        plugin.actions.untraceAll();
        tracerSubscribedRef.current = false;
      };
    }

    return () => {
      //unsubscribeChange();
      plugin.actions.untraceAll();
      tracerSubscribedRef.current = false;
    };
  }, [viewer]);

  // Log tracer info for debugging (can be used for UI display)
  // useEffect(() => {
  //   if (tracerInfo.size > 0) {
  //     tracerInfo.forEach((trace, entityId) => {
  //       console.log(`Tracer state: ${entityId} - ${trace.coordinates.length} points`);
  //     });
  //   }
  // }, [tracerInfo]);

  // Calculate popup position to stay within viewport bounds
  const popupPosition = usePopupPosition(popupInfo, popupDimensions);

  // Close sticky info handler for a specific entity
  const handleCloseStickyInfo = useCallback((entityId: string) => {
    const plugin = viewer?.plugins?.['stickyInfo'] as StickyInfoPlugin | undefined;
    if (plugin) {
      plugin.actions.closeInfo(entityId);
    }
  }, [viewer]);

  // const handleRightClick = useCallback((entity: Entity | null, location: MapClickLocation) => {
  //   console.log('onRightClick:', { entity: entity?.id, location });
  // }, []);

  // const handleDblClick = useCallback((entity: Entity | null, location: MapClickLocation) => {
  //   console.log('onDblClick:', { entity: entity?.id, location });
  // }, []);

  const handleMultiSelect = useCallback((entities: Entity[], prevEntities: Entity[], utils: { getScreenPosition: (entity: Entity) => Cartesian2 | undefined }) => {
    console.log('onMultiSelect:', entities.map(e => e.id), 'prev:', prevEntities.map(e => e.id));

    // Only show popup when selection grew to exactly 1 (not when shrinking via removal)
    if (entities.length === 1 && prevEntities.length < 1) {
      const entity = entities[0];
      if (!entity.id?.toString().includes('drone')) {
        const screenPosition = utils.getScreenPosition(entity);
        setPopupInfo({ entity, screenPosition });
      }
    } else {
      setPopupInfo(null);
    }
  }, []);

  const handleSelectionPanelClick = useCallback((entity: Entity, actions: { zoom?: { zoomToEntity: (id: string) => void } }) => {
    console.log('Selection panel click:', entity.id);
    actions.zoom?.zoomToEntity(entity.id);
  }, []);

  const toastRef = useRef<ToastRef>(null);

  const handleGroupClick = useCallback((groupKey: string, entities: Entity[]) => {
    const names = entities.map(e => e.name || e.id).join(", ");
    toastRef.current?.show(`Activating all ${groupKey} entities: ${names}`);
  }, []);

  const handleClusterAction = useCallback((entity: { id: string; name: string; type?: string }, layerId: string) => {
    toastRef.current?.show(`Action: ${entity.name} (${layerId})`);
  }, []);

  const handleClusterAllActions = useCallback((entities: Array<{ id: string; name: string; type?: string }>, layerId: string) => {
    const names = entities.map(e => e.name).join(", ");
    toastRef.current?.show(`Action on all ${entities.length} entities (${layerId}): ${names}`);
  }, []);

  const handleCluster = useCallback((
    layerId: string,
    clusteredEntities: Entity[],
    cluster: { billboard: unknown; label: unknown; point: unknown },
  ) => {
    const billboard = cluster.billboard as { show: boolean; image: unknown; id: unknown };
    const label = cluster.label as { show: boolean };
    const point = cluster.point as { show: boolean };

    billboard.show = true;
    billboard.image = createClusterCanvas(clusteredEntities.length);
    billboard.id = {
      isCluster: true,
      layerId,
      entities: clusteredEntities.map((e) => ({
        id: String(e.id),
        name: e.name ?? String(e.id),
        type: e.properties?.getValue?.(JulianDate.now())?.rendererType as string | undefined,
      })),
    } as ClusterBillboardId;

    label.show = false;
    point.show = false;
  }, []);

  // const handleRenderMultiSelection = useCallback((entity: Entity): Entity.ConstructorOptions | null => {
  //   // Custom render: use a larger yellow circle for drones, default for others
  //   if (entity.id?.toString().includes('drone')) {
  //     return {
  //       id: `__ms_${entity.id}`,
  //       position: entity.position!,
  //       point: {
  //         pixelSize: 50,
  //         color: Color.TRANSPARENT,
  //         outlineColor: Color.YELLOW.withAlpha(0.8),
  //         outlineWidth: 4,
  //       },
  //     };
  //   }
  //   return null; // Use default for other entities
  // }, []);

  const handleDataConnectorItem = useCallback((item: LayerData, layerName: string) => {
    void item;
    void layerName;

    // console.log('DataConnector onItem:', { layerName, item });
    // return false;
  }, []);

  const handleEntityCreating = useCallback((options: Entity.ConstructorOptions, item: LayeredDataWithPayload<MyDataPayload>) => {
    //console.log('onEntityCreating:', { id: options.id, renderType: item.renderType, item });

    void options;
    void item;
    // if (item.id === 'drone3') {
    //   console.log('Custom entity creation for drone:', options);
    //   // For drones, use a custom model and set up for animation
    //   return false; // Return false to skip default creation, we will create manually in customRenderer
    // }
  }, []);

  // const onEntityCreate = useCallback((
  //   type: RenderTypeFromRegistry<RendererRegistry>,
  //   item: LayerData,
  //   _renderers: RendererRegistry,
  //   layerId?: string
  // ) => {
  //   console.log('Entity creation requested:', { type, item, layerId });
  //   return null; // Return null to use default createEntityFromData
  // }, []);

  const handleMapClick = useCallback((entity: Entity | null, _location: MapClickLocation, screenPosition?: Cartesian2): boolean | void => {
    if (entity && screenPosition) {
      //setPopupInfo({ entity, location, screenPosition });
    } else {
      //setPopupInfo(null);
    }
  }, []);

  const handleClickPrevented = useCallback((
    entity: Entity,
    //location: MapClickLocation
  ): boolean | void => {
    setPopupInfo({ entity, prevented: true });
  }, []);

  const handleSelected = useCallback((entity: Entity | null, location?: MapClickLocation, screenPosition?: Cartesian2): boolean | void => {
    console.log('Entity onSelected(on prop):', {
      entityId: entity?.id ?? 'none',
      location,
      screenPosition,
    });
    if (entity) {
      // Skip popup for drones - they use StickyInfo plugin
      if (entity.id?.toString().includes('drone')) {
        return;
      }
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

  useDroneAnimation(viewer, {
    droneId: "drone2",
    centerLon: -104.99,
    centerLat: 39.7392,
    radius: 1.5,
    baseAlt: 320,
    altAmp: 12,
    segments: 64,
    orbitDurationMs: 20000,
  });

  useDroneAnimation2(viewer);

  useRadarAnimation(viewer, "radar1");


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

  const layers = useMemo(() => AppLayers(data, renderers), [data, renderers]);

  const handleLog = useCallback((entry: LogEntry) => {
    const timestamp = new Date(entry.timestamp).toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${entry.origin}]`;

    switch (entry.level) {
      case 'debug':
        console.log(prefix, entry.message, entry.data ?? '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data ?? '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data ?? '');
        break;
      case 'error':
        if (entry.error) {
          console.error(prefix, entry.message, entry.error, entry.data ?? '');
        } else {
          console.error(prefix, entry.message, entry.data ?? '');
        }
        break;
    }
  }, []);

  // const handleFeatureStateChanged = useCallback((name: 'layersPanel' | 'filtersPanel' | 'searchPanel' | 'entities', state: FeatureState) => {
  //   console.log(`Feature ${name} changed:`, state);
  // }, []);

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100vh', cursor: selectionModeActive ? 'crosshair' : 'default' }}>
        <Mmap
          provider="cesium"
          onEntityCreating={handleEntityCreating}
          // onEntityCreate={onEntityCreate}
          renderers={AppRenderers}
          mapConfig={mapConfig}
          baseMapProviders={baseMapProviders}
          animateActivation={true}
          animateVisibility={true}
          // onApiReady={handleApiReady}
          // onEntityChange={handleEntityChange}
          onClick={handleMapClick}
          onSelecting={handleSelecting}
          onClickPrevented={handleClickPrevented}
          onSelected={handleSelected}
          // onRightClick={handleRightClick}
          // onDblClick={handleDblClick}
          onChangePosition={handleChangePosition}
          onLog={handleLog}
          selectionIndicator={true}
          infoBox={false}
          multiSelect={multiSelectConfig}
          onMultiSelect={handleMultiSelect}
          clusteringConfig={clusteringConfig}
          onClusterRender={handleCluster}
          // onRenderMultiSelection={handleRenderMultiSelection}
          // onFeatureStateChanged={handleFeatureStateChanged}
          plugins={plugins}
        >
          {layers}
        </Mmap>

        <SelectionOverlay isActive={selectionModeActive} sourceEntity={selectionSourceEntity} />

        <FlightOverlay
          isAnimating={animationState.isAnimating}
          sourceId={animationState.sourceId}
          targetId={animationState.targetId}
          progress={animationState.progress}
          onCancel={animationControls.stopAnimation}
        />

        <EntityPopup
          popupInfo={popupInfo}
          popupPosition={popupPosition}
          onClose={() => setPopupInfo(null)}
        />

        <StickyPopups stickyInfoMap={stickyInfoMap} onClose={handleCloseStickyInfo} />

        <SelectionPanel onEntityClick={handleSelectionPanelClick} onGroupClick={handleGroupClick} />
        <Toast ref={toastRef} />
        <ClusterTooltip
          onAction={handleClusterAction}
          onAllActions={handleClusterAllActions}
        />
        <PositionInfoBar position={currentPosition} />

        {viewer && <DataConnector
          dataSource={dataSourceDynamic}
          config={DataConnectorConfig}
          onItem={handleDataConnectorItem}
        />}
      </div>
    </>
  );
}

export default App;
