import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry, FeatureContext } from "../types";
import { useLayers } from "./core/useLayers";
import { useFilters } from "./core/useFilters";
import { useSearch } from "./core/useSearch";
import { useEntities } from "./core/useEntities";
import { featureExtensions } from "./extensions";

const useWithCtx = <T>(ctx: FeatureContext, hook: (ctx: FeatureContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

// Hook to compose all discovered plugins
const usePlugins = (ctx: FeatureContext) => {
  // Collect all plugin APIs
  const pluginApis: Record<string, unknown> = {};

  // Compose each plugin in order (respecting dependencies)
  for (const plugin of featureExtensions) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const api = useWithCtx(ctx, plugin.useFeature);
    pluginApis[plugin.name] = api;
  }

  return pluginApis;
};

export const useFeatures = <R extends RendererRegistry>(
  layerProps: LayerProps<LayerData, R>[],
) => {
  const ctx: FeatureContext = { layers: layerProps };

  // Core features
  const layers = useWithCtx(ctx, useLayers);
  const filters = useWithCtx(ctx, useFilters);
  const search = useWithCtx(ctx, useSearch);
  const entities = useWithCtx(ctx, useEntities);

  // Dynamic plugins from plugins folder
  const plugins = usePlugins(ctx);

  return useMemo(
    () => ({ layers, filters, search, entities, ...plugins }),
    [layers, filters, search, entities, plugins],
  );
};
