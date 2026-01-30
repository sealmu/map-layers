import type { ReactNode } from "react";
import type { IRendererRegistry, ILayerProps } from "../../types";

// This component doesn't render anything - it's just used to pass props to CesiumMap

function Layer<T, R extends IRendererRegistry = IRendererRegistry>(
  _props: ILayerProps<T, R>,
): ReactNode {
  void _props;
  return null;
}

export default Layer;
