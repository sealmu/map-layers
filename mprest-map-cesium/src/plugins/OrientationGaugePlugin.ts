import { createEventHandler } from "@mprest/map-core";
import type { ICameraOrientation, IEventHandler } from "@mprest/map-core";
import type { FC } from "react";
import type { MapInstance } from "../types";
import { BasePlugin } from "../types";
import { createOrientationGaugeView } from "./components/OrientationGauge/createOrientationGaugeView";
import type { OrientationGaugeViewProps } from "./components/OrientationGauge/createOrientationGaugeView";

// ============================================
// Types
// ============================================

export interface OrientationGaugePluginOptions {
  /** Threshold in radians to avoid noisy updates. Default: 0.0001 */
  threshold?: number;
}

interface OrientationGaugeActions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
  configure: (options: OrientationGaugePluginOptions) => void;
}

interface OrientationGaugeEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: IEventHandler<(...args: any[]) => any>;
  onRender: IEventHandler<(orientation: ICameraOrientation | null) => void>;
}

// ============================================
// Plugin
// ============================================

export class OrientationGaugePlugin extends BasePlugin<
  OrientationGaugeActions,
  OrientationGaugeEvents
> {
  private unsubscribe: (() => void) | null = null;

  /** Current orientation — available for immediate read on mount */
  currentOrientation: ICameraOrientation | null = null;

  actions: OrientationGaugeActions;
  events: OrientationGaugeEvents;
  Renderer: FC<OrientationGaugeViewProps>;

  constructor(map: MapInstance) {
    super(map);

    this.actions = {
      configure: this.configure.bind(this),
    };

    this.events = {
      onRender: createEventHandler(),
    };

    this.Renderer = createOrientationGaugeView();

    this.startListening();
  }

  private configure(_options: OrientationGaugePluginOptions) {
    // Reserved for future customization
  }

  private startListening() {
    const viewer = this.map.viewer;

    // Subscribe to the viewer's onOrientation handler (emitted by useOrientationHandler)
    this.unsubscribe = viewer.handlers.onOrientation.subscribe(
      (orientation: ICameraOrientation) => {
        this.currentOrientation = orientation;
        this.emitRender(orientation);
      },
    );
  }

  private emitRender(orientation: ICameraOrientation | null) {
    this.events.onRender.subscribers.forEach((callback) =>
      callback(orientation),
    );
  }

  /** Read current orientation directly from camera */
  readOrientation(): ICameraOrientation {
    return {
      heading: this.map.viewer.camera.heading,
      pitch: this.map.viewer.camera.pitch,
      roll: this.map.viewer.camera.roll,
    };
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.emitRender(null);
  }
}
