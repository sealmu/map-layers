import { useState } from "react";
import { ViewerContext } from "../viewerProvider";
import type { IViewerProviderProps, IViewerWithConfigs } from "../../types";

export function ViewerProvider({ children }: IViewerProviderProps) {
  const [viewer, setViewer] = useState<IViewerWithConfigs | null>(null);

  return (
    <ViewerContext.Provider value={{ viewer, setViewer }}>
      {children}
    </ViewerContext.Provider>
  );
}
