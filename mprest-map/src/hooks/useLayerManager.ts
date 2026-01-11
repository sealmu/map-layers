import { useState, useCallback, useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../types";

export const useLayerManager = <R extends RendererRegistry>(
  layers: LayerProps<LayerData, R>[],
) => {
  const [layerStates, setLayerStates] = useState<
    Record<string, { isActive: boolean; isVisible: boolean; isDocked: boolean }>
  >(() => {
    const initial: Record<
      string,
      { isActive: boolean; isVisible: boolean; isDocked: boolean }
    > = {
      "street-map": { isActive: true, isVisible: true, isDocked: false },
    };
    layers.forEach((layer) => {
      initial[layer.id] = {
        isActive: layer.isActive ?? true,
        isVisible: layer.isVisible ?? true,
        isDocked: layer.isDocked ?? false,
      };
    });
    return initial;
  });

  const dockedLayers = useMemo(() => {
    const set = new Set<string>();
    layers.forEach((layer) => {
      if (layerStates[layer.id]?.isDocked) {
        set.add(layer.id);
      }
    });
    return set;
  }, [layers, layerStates]);

  const toggleLayerActive = useCallback((layerId: string) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        isActive: !prev[layerId]?.isActive,
      },
    }));
  }, []);

  const toggleActiveAll = useCallback(() => {
    setLayerStates((prev) => {
      const allActive = layers
        .filter((layer) => layer.id !== "street-map")
        .every((layer) => prev[layer.id]?.isActive ?? false);
      const newStates = { ...prev };
      layers.forEach((layer) => {
        if (layer.id !== "street-map") {
          newStates[layer.id] = {
            ...newStates[layer.id],
            isActive: !allActive,
          };
        }
      });
      return newStates;
    });
  }, [layers]);

  const toggleVisibleAll = useCallback(() => {
    setLayerStates((prev) => {
      const allVisible = layers
        .filter((layer) => layer.id !== "street-map")
        .every((layer) => prev[layer.id]?.isVisible ?? false);
      const newStates = { ...prev };
      layers.forEach((layer) => {
        if (layer.id !== "street-map") {
          newStates[layer.id] = {
            ...newStates[layer.id],
            isVisible: !allVisible,
          };
        }
      });
      return newStates;
    });
  }, [layers]);

  const toggleLayerVisible = useCallback((layerId: string) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        isVisible: !prev[layerId]?.isVisible,
      },
    }));
  }, []);

  const toggleLayerDocked = useCallback((layerId: string) => {
    setLayerStates((prev) => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        isDocked: !prev[layerId]?.isDocked,
      },
    }));
  }, []);

  const layerConfigs = useMemo(
    () => [
      {
        id: "street-map",
        name: "Street Map",
        isActive: layerStates["street-map"]?.isActive ?? true,
        isVisible: layerStates["street-map"]?.isVisible ?? true,
        description: "OpenStreetMap base layer",
      },
      ...layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        isActive: layerStates[layer.id]?.isActive ?? true,
        isVisible: layerStates[layer.id]?.isVisible ?? true,
        description: layer.description,
        isDocked: layerStates[layer.id]?.isDocked ?? layer.isDocked ?? false,
      })),
    ],
    [layerStates, layers],
  );

  const layersPanelApi = useMemo(
    () => ({
      layerStates,
      setLayerStates,
      toggleLayerActive,
      toggleLayerVisible,
      toggleActiveAll,
      toggleVisibleAll,
      dockedLayers,
      toggleLayerDocked,
      layers: layerConfigs,
    }),
    [
      layerStates,
      setLayerStates,
      toggleLayerActive,
      toggleLayerVisible,
      toggleActiveAll,
      toggleVisibleAll,
      dockedLayers,
      toggleLayerDocked,
      layerConfigs,
    ],
  );

  return layersPanelApi;
};
