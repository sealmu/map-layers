import type { ReactNode } from "react";
import type {
  RendererRegistry,
  LayerProps,
} from "@mprest/map";

// This component doesn't render anything - it's just used to pass props to CesiumMap

function Layer<T, R extends RendererRegistry>(
  _props: LayerProps<T, R>,
): ReactNode {
  void _props;
  return null;
}

export default Layer;
