import type { LayerData, ExtractorSpec } from "@mprest/map-maplibre";

type PathValueSpec = {
  path: string;
  value: string | number | boolean;
};

export const extractByPathValue = <T extends LayerData>(
  data: T[],
  path: string,
  value: string | number | boolean,
): T[] => {
  return data.filter((item) => {
    const parts = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = item;
    for (const part of parts) {
      if (current === undefined || current === null) return false;
      current = current[part];
    }
    return current === value;
  }) as T[];
};

export const resolveExtractor = <T extends LayerData>(
  extractor: ExtractorSpec | undefined,
): ((data: T[]) => T[]) | undefined => {
  if (!extractor) return undefined;
  if (typeof extractor === "function") return extractor as unknown as (data: T[]) => T[];
  if (typeof extractor === "object" && "path" in extractor && "value" in extractor) {
    const spec = extractor as PathValueSpec;
    return (data: T[]) => extractByPathValue(data, spec.path, spec.value);
  }
  return undefined;
};

export const applyExtractor = <T extends LayerData>(
  data: T[],
  extractor: ExtractorSpec | undefined,
): T[] => {
  const extractorFn = resolveExtractor<T>(extractor);
  if (extractorFn) {
    return extractorFn(data);
  }
  return data;
};
