import { useMemo, useState, useCallback, useEffect, useRef } from "react";

import { Cartesian2, Entity } from "cesium";

import { useDroneAnimation, useDroneAnimation2 } from "./hooks/useDroneAnimation";
import { useRadarAnimation } from "./hooks/useRadarAnimation";
import { useDroneTargetAnimation } from "./hooks/useDroneTargetAnimation";

import {
  CesiumMap,
  ViewerProvider,
  useViewer,
  DataConnector,
  EntitySelectionPlugin,
} from "@mprest/map";

import { EntityPopup, type EntityPopupInfo, StickyPopups, usePopupPosition } from "./components/popups";
import { SelectionOverlay, FlightOverlay } from "./components/overlays";
import { PositionInfoBar } from "./components/PositionInfoBar";
import { AppLayers } from "./AppLayers";
import { AppRenderers } from "./AppRenderers";
import { AppPanels } from "./AppPanels";
import { dataSourceDynamic } from "./AppData";

import type {
  AppContentProps,
  LayeredDataWithPayload,
  ViewerWithConfigs,
  MapClickLocation,
} from "@mprest/map";

import { dataSource } from "./data/dataSource";

import { StickyInfoPlugin, type StickyEntityInfo } from "./plugins/StickyInfoPlugin";

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
  const { viewer } = useViewer();


  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [popupDimensions] = useState({ width: 350, height: 250 });
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [selectionSourceEntity, setSelectionSourceEntity] = useState<Entity | undefined>(undefined);
  const [stickyInfoMap, setStickyInfoMap] = useState<Map<string, StickyEntityInfo>>(new Map());

  const pluginsSubscribedRef = useRef(false);
  const stickyInfoSubscribedRef = useRef(false);

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

  const plugins = useMemo(() => ({
    entitySelection: EntitySelectionPlugin,
    stickyInfo: StickyInfoPlugin,
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
      setStickyInfoMap(prev => {
        const next = new Map(prev);
        next.set(entityId, info);
        return next;
      });
    });

    return () => {
      unsubscribeSource();
      unsubscribeRender();
      stickyInfoSubscribedRef.current = false;
    };
  }, [viewer]);

  // Calculate popup position to stay within viewport bounds
  const popupPosition = usePopupPosition(popupInfo, popupDimensions);

  // Close sticky info handler for a specific entity
  const handleCloseStickyInfo = useCallback((entityId: string) => {
    const plugin = viewer?.plugins?.['stickyInfo'] as StickyInfoPlugin | undefined;
    if (plugin) {
      plugin.actions.closeInfo(entityId);
    }
  }, [viewer]);

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
    setPopupInfo({ entity });
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

  const layers = useMemo(() => AppLayers(data, renderers), [data, renderers]);

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100vh', cursor: selectionModeActive ? 'crosshair' : 'default' }}>
        <CesiumMap
          // onEntityCreating={enrichEntity}
          // onEntityCreate={onEntityCreate}
          renderers={AppRenderers}
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
          {layers}
        </CesiumMap>

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

        <PositionInfoBar position={currentPosition} />

        {viewer && <DataConnector dataSource={dataSourceDynamic} config={DataConnectorConfig} />}
      </div>
    </>
  );
}

export default App;
