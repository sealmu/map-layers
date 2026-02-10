import { useState, useEffect, useRef } from "react";
import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartesian3, BoundingSphere } from "cesium";
import { useCesiumViewer } from "@mprest/map-cesium";
import type { ClusterBillboardId } from "../utils/clusterCanvas";

interface TooltipState {
  entities: Array<{ id: string; name: string; type?: string }>;
  x: number;
  y: number;
}

const MAX_VISIBLE = 8;

const TYPE_COLORS: Record<string, string> = {
  points: "#1976D2",
  polylines: "#F57C00",
  polygons: "#388E3C",
  labels: "#7B1FA2",
  domes: "#0097A7",
  cone: "#D32F2F",
  custom: "#757575",
};

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
        left: tooltip.x + 16,
        top: tooltip.y,
        transform: "translateY(-50%)",
        background: "#ffffff",
        color: "#212121",
        borderRadius: "8px",
        boxShadow:
          "0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.14), 0 1px 18px rgba(0,0,0,0.12)",
        padding: "8px 0",
        fontSize: "13px",
        fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
        fontWeight: 400,
        zIndex: 10000,
        minWidth: "160px",
        maxWidth: "260px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "4px 16px 8px",
          fontSize: "11px",
          color: "#1976D2",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid #E0E0E0",
          marginBottom: "4px",
        }}
      >
        {tooltip.entities.length} entities
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: "12px",
        padding: "0 16px",
        color: "#424242",
        lineHeight: "1.4",
      }}>
        {tooltip.entities.slice(0, MAX_VISIBLE).map((e) => (
          <>
            <span
              key={e.id}
              style={{
                padding: "4px 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {e.name}
            </span>
            <span
              key={`${e.id}-type`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 0",
              }}
            >
              {e.type && (
                <>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: TYPE_COLORS[e.type] ?? "#BDBDBD",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#9E9E9E" }}>
                    {e.type}
                  </span>
                </>
              )}
            </span>
          </>
        ))}
      </div>

      {remaining > 0 && (
        <div
          style={{
            padding: "4px 16px",
            color: "#9E9E9E",
            fontSize: "12px",
          }}
        >
          +{remaining} more
        </div>
      )}
    </div>
  );
}
