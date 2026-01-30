import { useContext } from "react";
import { ViewerContext } from "../context/viewerProvider";
import type { IViewerContextType } from "../types";

export function useViewer(): IViewerContextType {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return context;
}
