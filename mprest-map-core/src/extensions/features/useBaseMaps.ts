import { useState, useCallback, useMemo } from "react";
import type {
  ExtensionModule,
  ExtensionContext,
  IBaseMapConfig,
  IBaseMapState,
  IBaseMapsApi,
} from "../../types";

/**
 * Configuration for the base maps extension
 */
export interface BaseMapsConfig {
  /** Initial base maps configuration */
  baseMaps?: IBaseMapConfig[];
  /** Whether to allow multiple base maps enabled at once (default: true) */
  allowMultiple?: boolean;
}

/**
 * Factory to create a base maps hook with configuration
 */
export const createUseBaseMaps = (config: BaseMapsConfig = {}) => {
  const { allowMultiple = true } = config;

  return (ctx: ExtensionContext): IBaseMapsApi => {
    // Get base maps from context (passed from component props) or config
    const initialBaseMaps = (ctx.baseMapProviders as IBaseMapConfig[]) ?? config.baseMaps ?? [];

    // Initialize state from base map configs
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [baseMapStates, setBaseMapStates] = useState<Record<string, IBaseMapState>>(() => {
      const initial: Record<string, IBaseMapState> = {};
      initialBaseMaps.forEach((baseMap) => {
        initial[baseMap.id] = {
          isEnabled: baseMap.isEnabled ?? false,
          isListed: baseMap.isListed ?? true,
        };
      });
      return initial;
    });

    // Initialize order from initial base maps (first = back/bottom, last = front/top)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [baseMapOrder, setBaseMapOrder] = useState<string[]>(() =>
      initialBaseMaps.map((bm) => bm.id)
    );

    // Memoize the full base maps list with current state, ordered by baseMapOrder
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const baseMaps = useMemo(() => {
      const baseMapById = new Map(initialBaseMaps.map((bm) => [bm.id, bm]));
      return baseMapOrder
        .filter((id) => baseMapById.has(id))
        .map((id) => {
          const baseMap = baseMapById.get(id)!;
          return {
            ...baseMap,
            isEnabled: baseMapStates[baseMap.id]?.isEnabled ?? baseMap.isEnabled ?? false,
            isListed: baseMapStates[baseMap.id]?.isListed ?? baseMap.isListed ?? true,
          };
        });
    }, [initialBaseMaps, baseMapStates, baseMapOrder]);

    // Enabled base maps (in order)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const enabledBaseMaps = useMemo(() => {
      return baseMaps.filter((bm) => bm.isEnabled);
    }, [baseMaps]);

    // Toggle a base map's enabled state
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const toggleBaseMap = useCallback((id: string) => {
      setBaseMapStates((prev) => {
        const current = prev[id]?.isEnabled ?? false;
        const newEnabled = !current;

        // If not allowing multiple and enabling this one, disable others
        if (!allowMultiple && newEnabled) {
          const newStates: Record<string, IBaseMapState> = {};
          Object.keys(prev).forEach((key) => {
            newStates[key] = {
              ...prev[key],
              isEnabled: key === id,
            };
          });
          return newStates;
        }

        return {
          ...prev,
          [id]: {
            ...prev[id],
            isEnabled: newEnabled,
          },
        };
      });
    }, [allowMultiple]);

    // Explicitly set enabled state
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const setBaseMapEnabled = useCallback((id: string, enabled: boolean) => {
      setBaseMapStates((prev) => {
        // If not allowing multiple and enabling, disable others
        if (!allowMultiple && enabled) {
          const newStates: Record<string, IBaseMapState> = {};
          Object.keys(prev).forEach((key) => {
            newStates[key] = {
              ...prev[key],
              isEnabled: key === id,
            };
          });
          return newStates;
        }

        return {
          ...prev,
          [id]: {
            ...prev[id],
            isEnabled: enabled,
          },
        };
      });
    }, [allowMultiple]);

    // Set whether listed in panel
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const setBaseMapListed = useCallback((id: string, listed: boolean) => {
      setBaseMapStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          isListed: listed,
        },
      }));
    }, []);

    // Enable only a specific base map (radio behavior)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const enableOnlyBaseMap = useCallback((id: string) => {
      setBaseMapStates((prev) => {
        const newStates: Record<string, IBaseMapState> = {};
        Object.keys(prev).forEach((key) => {
          newStates[key] = {
            ...prev[key],
            isEnabled: key === id,
          };
        });
        return newStates;
      });
    }, []);

    // Reorder base maps (first = back/bottom, last = front/top)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const reorderBaseMaps = useCallback((orderedIds: string[]) => {
      setBaseMapOrder(orderedIds);
    }, []);

    // Move a base map to a specific index
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const moveBaseMap = useCallback((id: string, toIndex: number) => {
      setBaseMapOrder((prev) => {
        const fromIndex = prev.indexOf(id);
        if (fromIndex === -1 || fromIndex === toIndex) return prev;
        const newOrder = [...prev];
        newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, id);
        return newOrder;
      });
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      () => ({
        baseMaps,
        baseMapStates,
        enabledBaseMaps,
        baseMapOrder,
        toggleBaseMap,
        setBaseMapEnabled,
        setBaseMapListed,
        enableOnlyBaseMap,
        reorderBaseMaps,
        moveBaseMap,
      }),
      [
        baseMaps,
        baseMapStates,
        enabledBaseMaps,
        baseMapOrder,
        toggleBaseMap,
        setBaseMapEnabled,
        setBaseMapListed,
        enableOnlyBaseMap,
        reorderBaseMaps,
        moveBaseMap,
      ],
    );
  };
};

/**
 * Factory to create a base maps extension module
 */
export const createBaseMapsExtension = (config: BaseMapsConfig = {}): ExtensionModule<IBaseMapsApi> => ({
  name: "baseMaps",
  useExtension: createUseBaseMaps(config),
  priority: 10, // Load early since other extensions may depend on it
});

// Default extension for auto-discovery
const baseMapsExtension = createBaseMapsExtension();

// Type augmentation
declare module "../../types" {
  interface MapApi {
    baseMaps?: IBaseMapsApi;
  }
}

export default baseMapsExtension;
