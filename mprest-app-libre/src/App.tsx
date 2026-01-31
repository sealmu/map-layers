import { useMemo, useState, useCallback, useEffect, useRef } from "react";

import { ViewerProvider, Mmap, useViewer } from "@mprest/map-core";
// Importing from @mprest/map-maplibre auto-registers the "maplibre" provider
import {
  EntitySelectionPlugin,
  type AppContentProps,
  type LayeredDataWithPayload,
  type MapClickLocation,
  type MapLibreFeature,
  type ViewerWithConfigs,
} from "@mprest/map-maplibre";

import { EntityPopup, type EntityPopupInfo } from "./components/popups";
import { SelectionOverlay } from "./components/overlays";
import { PositionInfoBar } from "./components/PositionInfoBar";
import { AppLayers } from "./AppLayers";
import { AppRenderers } from "./AppRenderers";
import { AppPanels } from "./AppPanels";

import { dataSource } from "./data/dataSource";

import { useDroneAnimation, useTargetAnimation } from "./hooks";

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
  const { viewer } = useViewer() as { viewer: ViewerWithConfigs | null };

  const [popupInfo, setPopupInfo] = useState<EntityPopupInfo | null>(null);
  const [currentPosition, setCurrentPosition] = useState<MapClickLocation | null>(null);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [selectionSourceFeature, setSelectionSourceFeature] = useState<MapLibreFeature | undefined>(undefined);

  const pluginsSubscribedRef = useRef(false);
  const lastPositionUpdateRef = useRef<number>(0);

  // Define plugins
  const plugins = useMemo(() => ({
    entitySelection: EntitySelectionPlugin,
  }), []);

  // Target animation - starts when onTargetSet fires
  const { startTargetAnimation } = useTargetAnimation(viewer, {
    durationMs: 3000,
    onComplete: (source, target) => {
      console.log('Animation complete:', source.id, 'arrived at', target.id);
    },
  });

  // Subscribe to plugin events
  useEffect(() => {
    if (!viewer || !viewer.plugins || pluginsSubscribedRef.current) return;

    const plugin = viewer.plugins['entitySelection'] as InstanceType<typeof EntitySelectionPlugin>;
    if (!plugin) return;

    pluginsSubscribedRef.current = true;

    // Subscribe to onEntitySource - return true for drones to enter selection mode
    const unsubscribeSource = plugin.events.onEntitySource.subscribe((feature) => {
      console.log('onEntitySource:', feature.id);
      // Enter selection mode for entities with 'drone' in their ID
      if (feature.id?.toString().includes('drone')) {
        return true;
      }
      return false;
    });

    // Subscribe to onEntityTarget - accept any non-drone entity as target (like Cesium)
    const unsubscribeTarget = plugin.events.onEntityTarget.subscribe((feature) => {
      console.log('onEntityTarget:', feature.id);
      // Accept any entity that's not a drone (source) as a valid target
      if (!feature.id?.toString().includes('drone')) {
        return true;
      }
      return false;
    });

    // Subscribe to onTargetSet - handle when source->target is set
    const unsubscribeSet = plugin.events.onTargetSet.subscribe((source, target) => {
      console.log('onTargetSet:', source.id, '->', target.id);
      // Start animation - move source towards target
      startTargetAnimation(source, target);
    });

    // Subscribe to selection mode changes
    const unsubscribeSelectionChanged = plugin.events.onSelectionChanged.subscribe((isActive, sourceFeature) => {
      console.log('Selection mode changed:', isActive, sourceFeature?.id);
      setSelectionModeActive(isActive);
      setSelectionSourceFeature(sourceFeature);
    });

    return () => {
      unsubscribeSource();
      unsubscribeTarget();
      unsubscribeSet();
      unsubscribeSelectionChanged();
      pluginsSubscribedRef.current = false;
    };
  }, [viewer, startTargetAnimation]);

  const handleMapClick = useCallback((
    feature: MapLibreFeature | null,
    location: MapClickLocation
  ): boolean | void => {
    // Skip popup during selection mode - plugin handles those clicks
    if (selectionModeActive) {
      if (!feature) {
        // Clicked empty space during selection - clear popup
        setPopupInfo(null);
      }
      return;
    }
    // Skip popup for drones - they use selection mode
    if (feature?.id?.toString().includes('drone')) {
      return;
    }
    if (feature) {
      setPopupInfo({ feature, location });
    } else {
      setPopupInfo(null);
    }
  }, [selectionModeActive]);

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
    // Skip popup during selection mode - plugin handles those clicks
    if (selectionModeActive) {
      return;
    }
    // Skip popup for drones - they use selection mode
    if (feature.id?.toString().includes('drone')) {
      return;
    }
    // Show popup without location to indicate selection was prevented
    setPopupInfo({ feature });
  }, [selectionModeActive]);

  const handleSelected = useCallback((
    feature: MapLibreFeature | null,
    location?: MapClickLocation
  ): boolean | void => {
    if (feature) {
      // Skip popup for drones - they use selection mode
      if (feature.id?.toString().includes('drone')) {
        return;
      }
      setPopupInfo({ feature, location });
    }
  }, []);

  // Throttle position updates to reduce re-renders during animation
  const handleChangePosition = useCallback((location: MapClickLocation | null): boolean | void => {
    const now = performance.now();
    if (now - lastPositionUpdateRef.current < 100) {
      return; // Throttle to max 10 updates per second
    }
    lastPositionUpdateRef.current = now;
    setCurrentPosition(location);
  }, []);

  const layers = useMemo(() => AppLayers(data, renderers), [data, renderers]);

  // Animate drone2 in a circular orbit (like Cesium version)
  useDroneAnimation(viewer, {
    droneId: "drone2",
    centerLon: -104.99,
    centerLat: 39.7392,
    radius: 1.5, // degrees
    segments: 64,
    orbitDurationMs: 20000,
  });

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: '100vh', cursor: selectionModeActive ? 'crosshair' : 'default' }}>
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
          plugins={plugins}
        >
          {layers}
        </Mmap>

        <SelectionOverlay isActive={selectionModeActive} sourceFeature={selectionSourceFeature} />

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
