import { useEffect, useRef, useCallback, useMemo } from "react";
import { ImageryLayer, Viewer as CesiumViewer } from "cesium";
import { useViewer, createUseBaseMaps } from "@mprest/map-core";
import type { IBaseMapsApi } from "@mprest/map-core";
import type { ExtensionModule, ExtensionContext, ViewerWithConfigs, BaseMapProviderConfig } from "../../types";

// Create core hook instance for state management
const useCoreBaseMaps = createUseBaseMaps();

/**
 * Cesium-specific base maps hook that extends core with ImageryLayer management
 */
const useCesiumBaseMaps = (ctx: ExtensionContext): IBaseMapsApi => {
  // Get core state management
  const coreApi = useCoreBaseMaps(ctx);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { viewer } = useViewer();

  // Get base map providers from context (Cesium-specific with provider instances)
  const baseMapProviders = (ctx.baseMapProviders as BaseMapProviderConfig[]) ?? [];

  // Track ImageryLayers by base map ID
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const imageryLayersRef = useRef<Map<string, ImageryLayer>>(new Map());

  // Track previous enabled states to detect changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const prevEnabledRef = useRef<Record<string, boolean>>({});

  // Get provider from config (handles both direct instance and factory)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const getProvider = useCallback((config: BaseMapProviderConfig) => {
    if (config.provider) {
      return config.provider;
    }
    if (config.createProvider) {
      return config.createProvider();
    }
    return null;
  }, []);

  // Sync core state to Cesium ImageryLayers
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!viewer) return;

    const cesiumViewer = viewer as unknown as ViewerWithConfigs;
    if (!cesiumViewer.imageryLayers) return;

    const imageryLayers = cesiumViewer.imageryLayers;
    const nativeViewer = cesiumViewer as unknown as CesiumViewer;

    // Process each base map provider
    baseMapProviders.forEach((config) => {
      const isEnabled = coreApi.baseMapStates[config.id]?.isEnabled ?? config.isEnabled ?? false;
      const wasEnabled = prevEnabledRef.current[config.id] ?? false;
      const existingLayer = imageryLayersRef.current.get(config.id);

      // Enabling: was disabled, now enabled
      if (isEnabled && !wasEnabled) {
        // Call onEnabling callback
        let providerToUse = getProvider(config);
        if (config.onEnabling) {
          const result = config.onEnabling(config, nativeViewer);
          if (result === false) {
            // Callback cancelled enabling - revert state
            coreApi.setBaseMapEnabled(config.id, false);
            return;
          }
          if (result) {
            // Callback returned a modified provider
            providerToUse = result;
          }
        }

        if (!existingLayer) {
          // Add new layer
          if (providerToUse) {
            const newLayer = imageryLayers.addImageryProvider(providerToUse);
            newLayer.show = true; // Ensure layer is visible
            imageryLayersRef.current.set(config.id, newLayer);
            // Call onEnabled callback
            config.onEnabled?.(config, newLayer, nativeViewer);
          }
        } else {
          // Show existing layer
          existingLayer.show = true;
          // Call onEnabled callback
          config.onEnabled?.(config, existingLayer, nativeViewer);
        }
      }
      // Disabling: was enabled, now disabled
      else if (!isEnabled && wasEnabled && existingLayer) {
        // Call onDisabling callback
        if (config.onDisabling) {
          const result = config.onDisabling(config, existingLayer, nativeViewer);
          if (result === false) {
            // Callback cancelled disabling - revert state
            coreApi.setBaseMapEnabled(config.id, true);
            return;
          }
        }

        // Hide layer
        existingLayer.show = false;
        // Call onDisabled callback
        config.onDisabled?.(config, nativeViewer);
      }

      // Update previous state
      prevEnabledRef.current[config.id] = isEnabled;
    });
  }, [viewer, baseMapProviders, coreApi.baseMapStates, coreApi.setBaseMapEnabled, getProvider]);

  // Sync order to Cesium ImageryLayers
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!viewer) return;

    const cesiumViewer = viewer as unknown as ViewerWithConfigs;
    if (!cesiumViewer.imageryLayers) return;

    const imageryLayers = cesiumViewer.imageryLayers;

    // Get only enabled layers in order (use state, not layer.show)
    const enabledOrderedIds = coreApi.baseMapOrder.filter((id) => {
      const isEnabled = coreApi.baseMapStates[id]?.isEnabled ?? false;
      const layer = imageryLayersRef.current.get(id);
      return isEnabled && layer && imageryLayers.contains(layer);
    });

    // Reorder imagery layers to match the UI order
    // UI: First in list = bottom of map (back), Last in list = top of map (front)
    // Cesium: index 0 = bottom, higher index = top
    // So list order matches Cesium order directly
    enabledOrderedIds.forEach((id, listIndex) => {
      const layer = imageryLayersRef.current.get(id);
      if (!layer) return;

      // List index maps directly to Cesium index (first = bottom, last = top)
      const targetIndex = listIndex;
      const currentIndex = imageryLayers.indexOf(layer);

      if (currentIndex !== targetIndex && currentIndex !== -1) {
        // Move layer to target position
        while (imageryLayers.indexOf(layer) < targetIndex) {
          imageryLayers.raise(layer);
        }
        while (imageryLayers.indexOf(layer) > targetIndex) {
          imageryLayers.lower(layer);
        }
      }
    });
  }, [viewer, coreApi.baseMapOrder, coreApi.baseMapStates]);

  // Cleanup on unmount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      if (!viewer) return;
      const cesiumViewer = viewer as unknown as ViewerWithConfigs;

      // Remove all managed imagery layers
      imageryLayersRef.current.forEach((layer) => {
        if (cesiumViewer.imageryLayers?.contains(layer)) {
          cesiumViewer.imageryLayers.remove(layer, false);
        }
      });
      imageryLayersRef.current.clear();
    };
  }, [viewer]);

  // Return core API (Cesium layer sync happens via effects)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => coreApi, [coreApi]);
};

// Extension definition
const cesiumBaseMapsExtension: ExtensionModule<IBaseMapsApi> = {
  name: "baseMaps",
  useExtension: useCesiumBaseMaps,
  priority: 10, // Load early
};

// Type augmentation
declare module "../../types" {
  interface MapApi {
    baseMaps?: IBaseMapsApi;
  }
}

export default cesiumBaseMapsExtension;
