import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry, ExtensionContext } from "../types";
import { useLayers } from "./core/useLayers";
import { useFilters } from "./core/useFilters";
import { useSearch } from "./core/useSearch";
import { useEntities } from "./core/useEntities";
import { featureModules } from "./features";

const useWithCtx = <T>(ctx: ExtensionContext, hook: (ctx: ExtensionContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

// Hook to compose all discovered features
const useFeatures = (ctx: ExtensionContext) => {
  // Collect all feature APIs
  const featureApis: Record<string, unknown> = {};

  // Compose each feature in order (respecting dependencies)
  for (const feature of featureModules) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const api = useWithCtx(ctx, feature.useExtension);
    featureApis[feature.name] = api;
  }

  return featureApis;
};

export const useExtensions = <R extends RendererRegistry>(
  layerProps: LayerProps<LayerData, R>[],
) => {
  const ctx: ExtensionContext = { layers: layerProps };

  // Core features
  const layers = useWithCtx(ctx, useLayers);
  const filters = useWithCtx(ctx, useFilters);
  const search = useWithCtx(ctx, useSearch);
  const entities = useWithCtx(ctx, useEntities);

  // Dynamic features from features folder
  const features = useFeatures(ctx);

  return useMemo(
    () => ({ layers, filters, search, entities, ...features }),
    [layers, filters, search, entities, features],
  );
};
