import type { LayerData, ExtractorSpec } from "@mprest/map";

type CacheKey = string;

const cache = new WeakMap<
  LayerData[],
  Map<CacheKey, LayerData[]>
>();

// Utility to safely get nested value by dot-separated path
export const getValueByPath = (obj: unknown, path: string): unknown => {
  if (!obj) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const key of parts) {
    if (current && typeof current === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current = (current as any)[key];
    } else {
      return undefined;
    }
  }
  return current;
};

// Extractor by arbitrary nested path and value (strict equality)
export const extractByPathValue = (
  data: LayerData[],
  path: string,
  value: unknown,
): LayerData[] => {
  let pathValueCache = cache.get(data);
  if (!pathValueCache) {
    pathValueCache = new Map<CacheKey, LayerData[]>();
    cache.set(data, pathValueCache);
  }

  const cacheKey = `${path}:${String(value)}`;
  const cached = pathValueCache.get(cacheKey);
  if (cached) return cached;

  const result = data.filter((item) => getValueByPath(item, path) === value);

  pathValueCache.set(cacheKey, result);
  return result;
};

export const resolveExtractor = (input: ExtractorSpec) => {
  if (typeof input === "function") return input;
  return (data: LayerData[]) =>
    extractByPathValue(data, input.path, input.value);
};

export const applyExtractor = (
  data: LayerData[],
  input: ExtractorSpec,
): LayerData[] => resolveExtractor(input)(data);
