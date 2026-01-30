import { useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../types";
import { useLayers } from "./hooks/useLayers";
import { useFilters } from "./hooks/useFilters";
import { useSearch } from "./hooks/useSearch";
import { useEntities } from "./hooks/useEntities";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useWithCtx = <T>(ctx: Record<string, any>, hook: (ctx: Record<string, any>) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

export const useFeatures = <R extends RendererRegistry>(
  layerProps: LayerProps<LayerData, R>[],
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: Record<string, any> = { layers: layerProps };

  const layers = useWithCtx(ctx, useLayers);
  const filters = useWithCtx(ctx, useFilters);
  const search = useWithCtx(ctx, useSearch);
  const entities = useWithCtx(ctx, useEntities);

  return useMemo(
    () => ({ layers, filters, search, entities }),
    [layers, filters, search, entities],
  );
};
