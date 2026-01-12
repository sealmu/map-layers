import type { LayersConfigItem } from "@mprest/map";
import { extractPolylines } from "../helpers/extractors/dataExtractors";

const config = [
  {
    id: "polylines",
    name: "Routes",
    type: "polylines",
    extractor: extractPolylines,
    isActive: true,
    isVisible: true,
    description: "Line routes connecting locations",
  },
  {
    id: "labels",
    name: "Labels",
    type: "labels",
    extractor: { path: "view", value: "labels" },
    isActive: false,
    isVisible: false,
    description: "City labels with markers",
    group: "basic-shape",
    groupName: "Basic Shapes",
    groupIsDocked: false,
  },
];

let memoizedConfig: LayersConfigItem[] | null = null;

export const getLayersConfig = (): LayersConfigItem[] => {
  if (memoizedConfig) return memoizedConfig;

  memoizedConfig = config as LayersConfigItem[];
  return memoizedConfig;
};
