import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Cartesian2,
  Cartesian3,
  BoundingSphere,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";
import { useViewer, createEventHandler } from "@mprest/map-core";
import type {
  ExtensionModule,
  ExtensionContext,
  ViewerWithConfigs,
  ClusterBillboardId,
  IEventHandler,
} from "../../types";

// ============================================
// Types
// ============================================

export interface ClusterHoverState {
  entities: Array<{ id: string; name: string; type?: string }>;
  layerId: string;
  x: number;
  y: number;
}

export interface ClusterClickEvent {
  entities: Array<{ id: string; name: string; type?: string }>;
  layerId: string;
}

export interface ClusterApi {
  /** Current cluster hover state (null when not hovering a cluster) */
  hoverState: ClusterHoverState | null;
  /** Event fired when hover state changes */
  onClusterHover: IEventHandler<(state: ClusterHoverState | null) => void>;
  /** Event fired when a cluster billboard is clicked */
  onClusterClick: IEventHandler<(event: ClusterClickEvent) => void>;
  /** Whether click-to-zoom is enabled */
  clickToZoom: boolean;
  /** Enable or disable click-to-zoom behavior */
  setClickToZoom: (enabled: boolean) => void;
}

// ============================================
// Helpers
// ============================================

function getClusterData(picked: unknown): ClusterBillboardId | undefined {
  const obj = picked as { id?: { isCluster?: boolean } } | null | undefined;
  if (obj?.id?.isCluster) {
    return obj.id as unknown as ClusterBillboardId;
  }
  return undefined;
}

// ============================================
// NOOP API
// ============================================

const NOOP_API: ClusterApi = {
  hoverState: null,
  onClusterHover: createEventHandler(),
  onClusterClick: createEventHandler(),
  clickToZoom: false,
  setClickToZoom: () => {},
};

// ============================================
// Extension Hook
// ============================================

const useCluster = (ctx: ExtensionContext): ClusterApi => {
  const clusteringConfig = ctx.clusteringConfig as Record<string, unknown> | undefined;
  const enabled = !!clusteringConfig;

  const { viewer } = useViewer();
  const cesiumViewer = viewer as unknown as ViewerWithConfigs | null;

  const [hoverState, setHoverState] = useState<ClusterHoverState | null>(null);
  const [clickToZoom, setClickToZoom] = useState(true);
  const clickToZoomRef = useRef(true);

  useEffect(() => {
    clickToZoomRef.current = clickToZoom;
  }, [clickToZoom]);

  const onClusterHoverHandler = useMemo(
    () => createEventHandler<(state: ClusterHoverState | null) => void>(),
    [],
  );

  const onClusterClickHandler = useMemo(
    () => createEventHandler<(event: ClusterClickEvent) => void>(),
    [],
  );

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire onClusterHover when hoverState changes
  useEffect(() => {
    if (!enabled) return;
    onClusterHoverHandler.subscribers.forEach((cb) => cb(hoverState));
  }, [enabled, hoverState, onClusterHoverHandler]);

  // Set up ScreenSpaceEventHandler
  useEffect(() => {
    if (!enabled || !cesiumViewer) return;

    const handler = new ScreenSpaceEventHandler(cesiumViewer.scene.canvas);

    // Hover detection
    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) => {
        const picked = cesiumViewer.scene.pick(movement.endPosition);
        const data = getClusterData(picked);

        if (data) {
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
          }
          setHoverState({
            entities: data.entities,
            layerId: data.layerId,
            x: movement.endPosition.x,
            y: movement.endPosition.y,
          });
        } else {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => setHoverState(null), 80);
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    // Click detection
    handler.setInputAction(
      (click: { position: Cartesian2 }) => {
        const picked = cesiumViewer.scene.pick(click.position);
        const data = getClusterData(picked);

        if (data) {
          setHoverState(null);

          const clickEvent: ClusterClickEvent = {
            entities: data.entities,
            layerId: data.layerId,
          };

          onClusterClickHandler.subscribers.forEach((cb) => cb(clickEvent));

          // Click-to-zoom
          if (clickToZoomRef.current) {
            const positions: Cartesian3[] = [];
            for (let i = 0; i < cesiumViewer.dataSources.length; i++) {
              const ds = cesiumViewer.dataSources.get(i);
              for (const info of data.entities) {
                const entity = ds.entities.getById(info.id);
                const pos = entity?.position?.getValue(cesiumViewer.clock.currentTime);
                if (pos) positions.push(pos);
              }
            }

            if (positions.length > 0) {
              const bs = BoundingSphere.fromPoints(positions);
              bs.radius = Math.max(bs.radius * 2.5, 50000);
              cesiumViewer.camera.flyToBoundingSphere(bs, { duration: 1.0 });
            }
          }
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    );

    return () => {
      handler.destroy();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [enabled, cesiumViewer, onClusterClickHandler]);

  const setClickToZoomCb = useCallback((val: boolean) => {
    setClickToZoom(val);
    clickToZoomRef.current = val;
  }, []);

  return useMemo(
    () =>
      enabled
        ? {
            hoverState,
            onClusterHover: onClusterHoverHandler,
            onClusterClick: onClusterClickHandler,
            clickToZoom,
            setClickToZoom: setClickToZoomCb,
          }
        : NOOP_API,
    [enabled, hoverState, onClusterHoverHandler, onClusterClickHandler, clickToZoom, setClickToZoomCb],
  );
};

// ============================================
// Extension Definition
// ============================================

const clusterExtension: ExtensionModule<ClusterApi> = {
  name: "cluster",
  useExtension: useCluster,
  priority: 3,
};

// Type augmentation
declare module "../../types" {
  interface MapApi {
    cluster?: ClusterApi;
  }
}

export default clusterExtension;
