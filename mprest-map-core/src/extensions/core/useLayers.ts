import { useState, useCallback, useMemo } from "react";
import type { LayerProps, LayerData, RendererRegistry } from "../../types";

type Layer = LayerProps<LayerData, RendererRegistry>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLayers = (ctx: Record<string, any>) => {
  const layers = ctx.layers as Layer[];
  const [layerStates, setLayerStates] = useState<
    Record<string, { isActive: boolean; isVisible: boolean; isDocked: boolean }>
  >(() => {
    const initial: Record<
      string,
      { isActive: boolean; isVisible: boolean; isDocked: boolean }
    > = {};
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
      const allActive = layers.every((layer) => prev[layer.id]?.isActive ?? false);
      const newStates = { ...prev };
      layers.forEach((layer) => {
        newStates[layer.id] = {
          ...newStates[layer.id],
          isActive: !allActive,
        };
      });
      return newStates;
    });
  }, [layers]);

  const toggleVisibleAll = useCallback(() => {
    setLayerStates((prev) => {
      const allVisible = layers.every((layer) => prev[layer.id]?.isVisible ?? false);
      const newStates = { ...prev };
      layers.forEach((layer) => {
        newStates[layer.id] = {
          ...newStates[layer.id],
          isVisible: !allVisible,
        };
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

  const toggleGroupActive = useCallback(
    (group: string) => {
      setLayerStates((prev) => {
        const groupLayers = layers.filter((layer) => layer.group === group);
        const someActive = groupLayers.some(
          (layer) => prev[layer.id]?.isActive ?? false,
        );
        const newStates = { ...prev };
        groupLayers.forEach((layer) => {
          newStates[layer.id] = {
            ...newStates[layer.id],
            isActive: !someActive,
          };
        });
        return newStates;
      });
    },
    [layers],
  );

  const toggleGroupVisible = useCallback(
    (group: string) => {
      setLayerStates((prev) => {
        const groupLayers = layers.filter((layer) => layer.group === group);
        const allVisible = groupLayers.every(
          (layer) => prev[layer.id]?.isVisible ?? false,
        );
        const newStates = { ...prev };
        groupLayers.forEach((layer) => {
          newStates[layer.id] = {
            ...newStates[layer.id],
            isVisible: !allVisible,
          };
        });
        return newStates;
      });
    },
    [layers],
  );

  const toggleGroupDocked = useCallback(
    (group: string) => {
      setLayerStates((prev) => {
        const groupLayers = layers.filter((layer) => layer.group === group);
        const someDocked = groupLayers.some(
          (layer) => prev[layer.id]?.isDocked ?? false,
        );
        const newStates = { ...prev };
        groupLayers.forEach((layer) => {
          newStates[layer.id] = {
            ...newStates[layer.id],
            isDocked: !someDocked,
          };
        });
        return newStates;
      });
    },
    [layers],
  );

  const layerConfigs = useMemo(
    () =>
      layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        isActive: layerStates[layer.id]?.isActive ?? true,
        isVisible: layerStates[layer.id]?.isVisible ?? true,
        description: layer.description,
        isDocked: layerStates[layer.id]?.isDocked ?? layer.isDocked ?? false,
        group: layer.group,
        groupName: layer.groupName,
        groupIsDocked: layer.groupIsDocked,
      })),
    [layerStates, layers],
  );

  const api = useMemo(
    () => ({
      layerStates,
      setLayerStates,
      toggleLayerActive,
      toggleLayerVisible,
      toggleActiveAll,
      toggleVisibleAll,
      dockedLayers,
      toggleLayerDocked,
      toggleGroupActive,
      toggleGroupVisible,
      toggleGroupDocked,
      layerConfigs,
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
      toggleGroupActive,
      toggleGroupVisible,
      toggleGroupDocked,
      layerConfigs,
    ],
  );

  return api;
};
