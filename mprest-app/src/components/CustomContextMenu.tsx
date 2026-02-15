import type { ReactNode } from "react";
import type { IContextMenuRenderInfo } from "@mprest/map-core";

interface CustomContextMenuProps {
  info: IContextMenuRenderInfo;
  onClose: () => void;
  children: ReactNode;
}

export function CustomContextMenu({ info, children }: CustomContextMenuProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: info.screenPosition.x + 4,
        top: info.screenPosition.y + 4,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        color: "#e0e0e0",
        borderRadius: "8px",
        padding: "6px 0",
        minWidth: "180px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 1px rgba(100,180,255,0.3)",
        border: "1px solid rgba(100,180,255,0.15)",
        zIndex: 3100,
        pointerEvents: "auto",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {info.entityName && (
        <div
          style={{
            padding: "6px 14px 8px",
            fontSize: "11px",
            color: "#7eb8ff",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            borderBottom: "1px solid rgba(100,180,255,0.1)",
            marginBottom: "4px",
          }}
        >
          {info.entityName}
        </div>
      )}
      {children}
    </div>
  );
}
