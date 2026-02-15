import { useCallback, type ReactNode } from "react";
import type { IContextMenuItem, IContextMenuRenderInfo } from "@mprest/map-core";

export interface ContextMenuRendererProps {
  menuInfo: IContextMenuRenderInfo | null;
  onClose: () => void;
  onRenderItem?: (
    item: IContextMenuItem,
    index: number,
    info: IContextMenuRenderInfo,
  ) => ReactNode;
  onRenderMenu?: (
    info: IContextMenuRenderInfo,
    defaultContent: ReactNode,
    close: () => void,
  ) => ReactNode;
}

const MENU_WIDTH = 200;

function calcMenuPosition(
  screenPosition: { x: number; y: number },
  menuWidth: number,
  menuHeight: number,
): { left: number; top: number } {
  const offset = 4;
  let left = screenPosition.x + offset;
  let top = screenPosition.y + offset;

  if (left + menuWidth > window.innerWidth) {
    left = screenPosition.x - menuWidth - offset;
  }
  if (top + menuHeight > window.innerHeight) {
    top = screenPosition.y - menuHeight - offset;
  }

  left = Math.max(0, Math.min(left, window.innerWidth - menuWidth));
  top = Math.max(0, Math.min(top, window.innerHeight - menuHeight));

  return { left, top };
}

export function ContextMenuRenderer({
  menuInfo,
  onClose,
  onRenderItem,
  onRenderMenu,
}: ContextMenuRendererProps) {
  const handleItemClick = useCallback(
    (item: IContextMenuItem) => {
      if (item.disabled) return;
      item.action();
      onClose();
    },
    [onClose],
  );

  if (!menuInfo) return null;

  const estimatedMenuHeight = menuInfo.items.length * 36 + 8;
  const position = calcMenuPosition(
    menuInfo.screenPosition,
    MENU_WIDTH,
    estimatedMenuHeight,
  );

  const defaultContent = (
    <>
      {menuInfo.items.map((item, index) => {
        if (onRenderItem) {
          return (
            <div key={index} onClick={() => handleItemClick(item)}>
              {onRenderItem(item, index, menuInfo)}
            </div>
          );
        }

        if (item.separator) {
          return (
            <div
              key={index}
              style={{
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.15)",
                margin: "4px 0",
              }}
            />
          );
        }

        return (
          <div
            key={index}
            onClick={() => handleItemClick(item)}
            style={{
              padding: "8px 16px",
              cursor: item.disabled ? "default" : "pointer",
              opacity: item.disabled ? 0.4 : 1,
              fontSize: "13px",
              whiteSpace: "nowrap",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {item.icon && (
              <span style={{ marginRight: "8px" }}>{item.icon}</span>
            )}
            {item.label}
          </div>
        );
      })}
    </>
  );

  if (onRenderMenu) {
    return <>{onRenderMenu(menuInfo, defaultContent, onClose)}</>;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.left}px`,
        top: `${position.top}px`,
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        color: "white",
        borderRadius: "6px",
        padding: "4px 0",
        minWidth: `${MENU_WIDTH}px`,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        zIndex: 3100,
        pointerEvents: "auto",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {defaultContent}
    </div>
  );
}
