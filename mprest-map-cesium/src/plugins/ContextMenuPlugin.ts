import { Entity, Cartesian2 } from "cesium";
import { createEventHandler } from "@mprest/map-core";
import type {
  IContextMenuItem,
  IContextMenuData,
  IContextMenuRenderInfo,
  IEventHandler,
} from "@mprest/map-core";
import type { FC } from "react";
import type {
  MapInstance,
  MapClickLocation,
} from "../types";
import { BasePlugin } from "../types";
import { createContextMenuView } from "./components/ContextMenu/createContextMenuView";
import type { ContextMenuRendererProps } from "./components/ContextMenu/ContextMenuRenderer";

export type ContextMenuItem = IContextMenuItem;
export type ContextMenuData = IContextMenuData;
export type ContextMenuRenderInfo = IContextMenuRenderInfo;

export interface ContextMenuPluginOptions {
  contextProp?: string;
}

interface ContextMenuActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
  close: () => void;
  configure: (options: ContextMenuPluginOptions) => void;
}

interface ContextMenuEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: IEventHandler<(...args: any[]) => any>;
  onRender: IEventHandler<(info: IContextMenuRenderInfo | null) => void>;
}

export class ContextMenuPlugin extends BasePlugin<
  ContextMenuActions,
  ContextMenuEvents
> {
  private currentMenu: IContextMenuRenderInfo | null = null;
  private options: ContextMenuPluginOptions = {};

  actions: ContextMenuActions;
  events: ContextMenuEvents;
  Renderer: FC<Pick<ContextMenuRendererProps, "onRenderItem" | "onRenderMenu">>;

  constructor(map: MapInstance) {
    super(map);
    this.actions = {
      close: this.close.bind(this),
      configure: this.configure.bind(this),
    };
    this.events = {
      onRender: createEventHandler(),
    };
    this.Renderer = createContextMenuView(this);
  }

  private configure(options: ContextMenuPluginOptions) {
    this.options = { ...this.options, ...options };
  }

  private close() {
    if (this.currentMenu) {
      this.currentMenu = null;
      this.emitRender(null);
    }
  }

  private emitRender(info: IContextMenuRenderInfo | null) {
    this.events.onRender.subscribers.forEach((callback) => callback(info));
  }

  private showMenu(
    entity: Entity,
    screenPosition: Cartesian2,
    items: IContextMenuItem[],
  ) {
    this.currentMenu = {
      entityId: entity.id?.toString() ?? "",
      entityName: entity.name,
      screenPosition: { x: screenPosition.x, y: screenPosition.y },
      items,
    };
    this.emitRender(this.currentMenu);
  }

  // Lifecycle hook: called by callPluginMethod when contextMenuProp matched
  onContextMenu = (
    entity: Entity,
    _location: MapClickLocation,
    screenPosition?: Cartesian2,
    contextMenuParams?: unknown,
  ): boolean | void => {
    if (!screenPosition) return;

    const params = contextMenuParams as IContextMenuData | undefined;
    if (params?.items && params.items.length > 0) {
      this.showMenu(entity, screenPosition, params.items);
    }
  };

  // Lifecycle hook: fallback path when options.contextProp is set
  onRightClick = (
    entity: Entity | null,
    _location: MapClickLocation,
    screenPosition?: Cartesian2,
  ): boolean | void => {
    if (!entity || !screenPosition || !this.options.contextProp) return;

    const propValue = entity.properties?.[this.options.contextProp]
      ?.getValue?.(this.map.viewer.clock.currentTime);

    if (propValue) {
      const params = propValue as IContextMenuData;
      if (params.items && params.items.length > 0) {
        this.showMenu(entity, screenPosition, params.items);
      }
    }
  };

  // Lifecycle hook: close menu on any left-click (click-away)
  onClick = (
    _entity: Entity | null,
    _location: MapClickLocation,
    _screenPosition?: Cartesian2,
  ): boolean | void => {
    this.close();
  };
}
