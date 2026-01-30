import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useViewer as useCoreViewer } from '@mprest/map-core';
import type { LayerData } from '@mprest/map-cesium';
import type { Entity } from 'cesium';

export interface LayerConfig {
  id: string;
  name: string;
  type: string;
  customRenderer?: (item: LayerData) => Entity.ConstructorOptions;
  isDocked?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  description?: string;
}

interface LayerContextValue {
  layers: {
    getLayerConfig: (layerId: string) => LayerConfig | undefined;
    getAllLayerConfigs: () => LayerConfig[];
  };
}

const LayerContext = createContext<LayerContextValue | null>(null);

interface LayerProviderProps {
  children: ReactNode;
  layerConfigs: LayerConfig[];
}

export const LayerProvider = ({ children, layerConfigs }: LayerProviderProps) => {
  const layers = useMemo(() => ({
    getLayerConfig: (layerId: string) => layerConfigs.find(config => config.id === layerId),
    getAllLayerConfigs: () => layerConfigs,
  }), [layerConfigs]);

  return (
    <LayerContext.Provider value={{ layers }}>
      {children}
    </LayerContext.Provider>
  );
};

// Extended useViewer hook that also provides layer information
export const useViewer = () => {
  const cesiumViewer = useCoreViewer();
  const layerContext = useContext(LayerContext);

  if (!layerContext) {
    throw new Error('useViewer must be used within a LayerProvider');
  }

  return {
    ...cesiumViewer,
    layers: layerContext.layers,
  };
};