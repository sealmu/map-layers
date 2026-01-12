import { useContext } from "react";
import { ViewerContext } from "../context/viewerProvider";
import type { ViewerContextType } from "@mprest/map";

export function useViewer(): ViewerContextType {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }
  return context;
}
