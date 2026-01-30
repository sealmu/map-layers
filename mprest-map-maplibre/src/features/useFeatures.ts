import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry, FeatureContext } from "../types";
import { useLayers } from "./core/useLayers";
import { useFilters } from "./core/useFilters";
import { useSearch } from "./core/useSearch";
import { useEntities } from "./core/useEntities";

const useWithCtx = <T>(ctx: FeatureContext, hook: (ctx: FeatureContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
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

  return useMemo(
    () => ({ layers, filters, search, entities }),
    [layers, filters, search, entities],
  );
};
