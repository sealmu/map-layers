import type { IScreenPosition } from "./coordinates";

export interface IContextMenuItem {
  label: string;
  action: () => void;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface IContextMenuData {
  items: IContextMenuItem[];
}

export interface IContextMenuRenderInfo {
  entityId: string;
  entityName?: string;
  screenPosition: IScreenPosition;
  items: IContextMenuItem[];
}
