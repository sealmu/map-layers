import { useState } from "react";
import type { Viewer as CesiumViewer } from "cesium";
import { ViewerContext } from "../viewerProvider";
import type { ViewerProviderProps } from "../../types";

export function ViewerProvider({ children }: ViewerProviderProps) {
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);

  return (
    <ViewerContext.Provider value={{ viewer, setViewer }}>
      {children}
    </ViewerContext.Provider>
  );
}
