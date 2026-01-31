import { useMemo } from "react";
import { createBookmarksExtension, type Bookmark } from "@mprest/map-core";
import type { LayerProps, LayerData, RendererRegistry, FeatureContext, ViewerWithConfigs } from "../types";
import { useLayers } from "./core/useLayers";
import { useFilters } from "./core/useFilters";
import { useSearch } from "./core/useSearch";
import { useEntities } from "./core/useEntities";
import locationsExtension from "./extensions/useLocations";

const useWithCtx = <T>(ctx: FeatureContext, hook: (ctx: FeatureContext) => T): T => {
  const api = hook(ctx);
  Object.assign(ctx, api);
  return api;
};

// MapLibre-specific bookmarks config
const maplibreBookmarksExtension = createBookmarksExtension({
  storageKey: "maplibre-bookmarks",
  // Get zoom directly from MapLibre map
  getZoom: (viewer) => {
    const maplibreViewer = viewer as unknown as ViewerWithConfigs;
    return maplibreViewer.map?.getZoom();
  },
  // Fly using MapLibre's native flyTo with zoom
  flyToWithZoom: (viewer, bookmark: Bookmark) => {
    const maplibreViewer = viewer as unknown as ViewerWithConfigs;
    const map = maplibreViewer.map;
    if (!map) return false;

    map.flyTo({
      center: [bookmark.position.longitude, bookmark.position.latitude],
      zoom: bookmark.zoom ?? map.getZoom(),
      bearing: (bookmark.camera.heading * 180) / Math.PI,
      pitch: (bookmark.camera.pitch * 180) / Math.PI,
      duration: 1500,
    });

    return true;
  },
});

export const useFeatures = <R extends RendererRegistry>(
  layerProps: LayerProps<LayerData, R>[],
) => {
  const ctx: FeatureContext = { layers: layerProps };

  // Core features
  const layers = useWithCtx(ctx, useLayers);
  const filters = useWithCtx(ctx, useFilters);
  const search = useWithCtx(ctx, useSearch);
  const entities = useWithCtx(ctx, useEntities);

  // Extensions (locations before bookmarks as it may be used as dependency)
  const locations = useWithCtx(ctx, locationsExtension.useFeature);
  const bookmarks = useWithCtx(ctx, maplibreBookmarksExtension.useFeature);

  return useMemo(
    () => ({ layers, filters, search, entities, locations, bookmarks }),
    [layers, filters, search, entities, locations, bookmarks],
  );
};
