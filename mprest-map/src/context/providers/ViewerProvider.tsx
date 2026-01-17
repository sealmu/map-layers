import { useState } from "react";
import { ViewerContext } from "../viewerProvider";
import type { ViewerProviderProps, ViewerWithConfigs } from "../../types";

export function ViewerProvider({ children }: ViewerProviderProps) {
  const [viewer, setViewer] = useState<ViewerWithConfigs | null>(null);

  return (
    <ViewerContext.Provider value={{ viewer, setViewer }}>
      {children}
    </ViewerContext.Provider>
  );
}
