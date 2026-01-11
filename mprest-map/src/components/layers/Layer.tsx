import type { ReactNode } from "react";
import type {
  EntityRenderer,
  RendererRegistry,
  RenderTypeFromRegistry,
  LayerData,
} from "../../types";

export interface LayerProps<
  T = LayerData,
  R extends RendererRegistry = RendererRegistry,
> {
  id: string;
  name: string;
  type: RenderTypeFromRegistry<R>;
  data: T[];
  isActive?: boolean;
  isVisible?: boolean;
  description?: string;
  customRenderer?: EntityRenderer;
  isDocked?: boolean;
}

// This component doesn't render anything - it's just used to pass props to CesiumMap

function Layer<T, R extends RendererRegistry>(
  _props: LayerProps<T, R>,
): ReactNode {
  void _props;
  return null;
}

export default Layer;
