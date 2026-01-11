import type { LayerData } from "@mprest/map";

type ViewKey = LayerData["view"];

const cache = new WeakMap<LayerData[], Map<ViewKey, LayerData[]>>();

export const extractByView = <T extends LayerData>(
  data: T[],
  view: ViewKey,
): T[] => {
  let viewCache = cache.get(data as LayerData[]);
  if (!viewCache) {
    viewCache = new Map<ViewKey, LayerData[]>();
    cache.set(data as LayerData[], viewCache);
  }

  const cached = viewCache.get(view) as T[] | undefined;
  if (cached) return cached;

  const result = data.filter((item) => item.view === view) as T[];

  viewCache.set(view, result);
  return result;
};
