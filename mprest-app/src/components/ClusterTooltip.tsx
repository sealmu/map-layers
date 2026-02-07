import { useState, useEffect, useRef } from "react";
import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartesian3, BoundingSphere } from "cesium";
import { useCesiumViewer } from "@mprest/map-cesium";
import type { ClusterBillboardId } from "../utils/clusterCanvas";

interface TooltipState {
  entities: Array<{ id: string; name: string }>;
  x: number;
  y: number;
}

const MAX_VISIBLE = 8;

export function ClusterTooltip() {
  const { viewer } = useCesiumViewer();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const picked: any = viewer.scene.pick(movement.endPosition);
        const data: ClusterBillboardId | undefined = picked?.id?.isCluster
          ? picked.id
          : undefined;

        if (data) {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          setTooltip({
            entities: data.entities,
            x: movement.endPosition.x,
            y: movement.endPosition.y,
          });
        } else {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setTooltip(null), 80);
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    handler.setInputAction(
      (click: { position: Cartesian2 }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const picked: any = viewer.scene.pick(click.position);
        const data: ClusterBillboardId | undefined = picked?.id?.isCluster
          ? picked.id
          : undefined;

        if (data) {
          setTooltip(null);

          // Collect entity positions from all data sources
          const positions: Cartesian3[] = [];
          for (let i = 0; i < viewer.dataSources.length; i++) {
            const ds = viewer.dataSources.get(i);
            for (const info of data.entities) {
              const entity = ds.entities.getById(info.id);
              const pos = entity?.position?.getValue(viewer.clock.currentTime);
              if (pos) positions.push(pos);
            }
          }

          if (positions.length > 0) {
            const bs = BoundingSphere.fromPoints(positions);
            bs.radius = Math.max(bs.radius * 2.5, 50000);
            viewer.camera.flyToBoundingSphere(bs, { duration: 1.0 });
          }
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    );

    return () => {
      handler.destroy();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [viewer]);

  if (!tooltip) return null;

  const remaining = tooltip.entities.length - MAX_VISIBLE;

  return (
    <div
      style={{
        position: "fixed",
        left: tooltip.x + 18,
        top: tooltip.y,
        transform: "translateY(-50%)",
        background:
          "linear-gradient(135deg, rgba(10, 10, 20, 0.94), rgba(20, 20, 35, 0.9))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#e5e7eb",
        borderRadius: "10px",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        boxShadow:
          "0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        padding: "8px 0",
        fontSize: "12px",
        fontFamily:
          "'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace",
        fontWeight: 500,
        zIndex: 10000,
        minWidth: "150px",
        maxWidth: "260px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "2px 12px 6px",
          fontSize: "10px",
          color: "#818cf8",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          marginBottom: "2px",
        }}
      >
        {tooltip.entities.length} entities
      </div>

      {tooltip.entities.slice(0, MAX_VISIBLE).map((e) => (
        <div
          key={e.id}
          style={{
            padding: "3px 12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#d1d5db",
          }}
        >
          {e.name}
        </div>
      ))}

      {remaining > 0 && (
        <div
          style={{
            padding: "3px 12px",
            color: "#6b7280",
            fontStyle: "italic",
            fontSize: "11px",
          }}
        >
          +{remaining} more
        </div>
      )}
    </div>
  );
}
