import { useState, useEffect, type FC } from "react";
import type { IContextMenuRenderInfo } from "@mprest/map-core";
import type { ContextMenuPlugin } from "../../ContextMenuPlugin";
import {
  ContextMenuRenderer,
  type ContextMenuRendererProps,
} from "./ContextMenuRenderer";

type ContextMenuViewProps = Pick<
  ContextMenuRendererProps,
  "onRenderItem" | "onRenderMenu"
>;

export function createContextMenuView(
  plugin: ContextMenuPlugin,
): FC<ContextMenuViewProps> {
  return function ContextMenuView({ onRenderItem, onRenderMenu }) {
    const [menuInfo, setMenuInfo] = useState<IContextMenuRenderInfo | null>(
      null,
    );

    useEffect(() => {
      return plugin.events.onRender.subscribe(setMenuInfo);
    }, []);

    return (
      <ContextMenuRenderer
        menuInfo={menuInfo}
        onClose={() => plugin.actions.close()}
        onRenderItem={onRenderItem}
        onRenderMenu={onRenderMenu}
      />
    );
  };
}
