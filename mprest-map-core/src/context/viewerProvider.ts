import { createContext } from "react";
import type { IViewerContextType } from "../types";

export const ViewerContext = createContext<IViewerContextType | undefined>(
  undefined,
);
