import type { ILayerData, IExtractorSpec } from "../../types";

type CacheKey = string;

const cache = new WeakMap<
  ILayerData[],
  Map<CacheKey, ILayerData[]>
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
  data: ILayerData[],
  path: string,
  value: unknown,
): ILayerData[] => {
  let pathValueCache = cache.get(data);
  if (!pathValueCache) {
    pathValueCache = new Map<CacheKey, ILayerData[]>();
    cache.set(data, pathValueCache);
  }

  const cacheKey = `${path}:${String(value)}`;
  const cached = pathValueCache.get(cacheKey);
  if (cached) return cached;

  const result = data.filter((item) => getValueByPath(item, path) === value);

  pathValueCache.set(cacheKey, result);
  return result;
};

export const resolveExtractor = (input: IExtractorSpec) => {
  if (typeof input === "function") return input;
  return (data: ILayerData[]) =>
    extractByPathValue(data, input.path, input.value);
};

export const applyExtractor = (
  data: ILayerData[],
  input: IExtractorSpec,
): ILayerData[] => resolveExtractor(input)(data);
