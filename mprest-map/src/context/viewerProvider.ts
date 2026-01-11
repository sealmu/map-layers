import { createContext } from "react";
import type { ViewerContextType } from "../types";

export const ViewerContext = createContext<ViewerContextType | undefined>(
  undefined,
);
