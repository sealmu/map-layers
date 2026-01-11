import type { LayerData } from "@mprest/map";

type ViewKey = LayerData["view"];

// Cache results by data reference and view key to keep stable array references
const cache = new WeakMap<LayerData[], Map<ViewKey, LayerData[]>>();

export const extractByView = (
  data: LayerData[],
  view: ViewKey,
): LayerData[] => {
  let viewCache = cache.get(data);
  if (!viewCache) {
    viewCache = new Map<ViewKey, LayerData[]>();
    cache.set(data, viewCache);
  }

  const cached = viewCache.get(view);
  if (cached) return cached;

  // filter data by view
  const result = data.filter((item) => item.view === view);

  viewCache.set(view, result);
  return result;
};
