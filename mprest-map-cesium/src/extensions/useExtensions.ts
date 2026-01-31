import { useMemo } from "react";
import { useLayers, useFilters, useSearch, useEntities } from "@mprest/map-core";
import type { LayerProps, LayerData, RendererRegistry, ExtensionContext } from "../types";
import { featureExtensions } from "./features";

const useWithCtx = <T>(ctx: ExtensionContext, hook: (ctx: ExtensionContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

// Hook to compose all discovered plugins
const usePlugins = (ctx: ExtensionContext) => {
  // Collect all plugin APIs
  const pluginApis: Record<string, unknown> = {};

  // Compose each plugin in order (respecting dependencies)
  for (const plugin of featureExtensions) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const api = useWithCtx(ctx, plugin.useExtension);
    pluginApis[plugin.name] = api;
  }

  return pluginApis;
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

  // Dynamic plugins from plugins folder
  const plugins = usePlugins(ctx);

  return useMemo(
    () => ({ layers, filters, search, entities, ...plugins }),
    [layers, filters, search, entities, plugins],
  );
};
