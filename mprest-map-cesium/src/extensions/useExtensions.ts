import { useMemo } from "react";
import { useLayers, useFilters, useSearch, useEntities } from "@mprest/map-core";
import type { LayerProps, LayerData, RendererRegistry, ExtensionContext } from "../types";
import { featureExtensions } from "./features";

const useWithCtx = <T>(ctx: ExtensionContext, hook: (ctx: ExtensionContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

// Hook to compose all discovered feature extensions
const useFeatureExtensions = (ctx: ExtensionContext) => {
  // Collect all extension APIs (array length is fixed — featureExtensions is static)
  const apis: unknown[] = [];

  for (const ext of featureExtensions) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const api = useWithCtx(ctx, ext.useExtension);
    apis.push(api);
  }

  // Memoize the container object so it only changes when an individual API changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const extensionApis: Record<string, unknown> = {};
    featureExtensions.forEach((ext, i) => {
      extensionApis[ext.name] = apis[i];
    });
    return extensionApis;
  }, apis);
};

export const useExtensions = <R extends RendererRegistry>(
  layerProps: LayerProps<LayerData, R>[],
  additionalContext?: Record<string, unknown>,
) => {
  const ctx: ExtensionContext = { layers: layerProps, ...additionalContext };

  // Core features
  const layers = useWithCtx(ctx, useLayers);
  const filters = useWithCtx(ctx, useFilters);
  const search = useWithCtx(ctx, useSearch);
  const entities = useWithCtx(ctx, useEntities);

  // Dynamic feature extensions
  const features = useFeatureExtensions(ctx);

  return useMemo(
    () => ({ layers, filters, search, entities, ...features }),
    [layers, filters, search, entities, features],
  );
};
