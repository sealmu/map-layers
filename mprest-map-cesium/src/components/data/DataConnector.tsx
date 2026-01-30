import { useEffect, useMemo } from "react";
import { useViewer } from "@mprest/map-core";
import { DataManager } from "../../helpers/data/DataManager";
import type { ViewerWithConfigs, LayerData, DataConnectorConfig } from "../../types";

export interface DataConnectorProps {
  dataSource: Record<string, LayerData[]>;
  config: DataConnectorConfig;
}

export function DataConnector({ dataSource, config }: DataConnectorProps) {
  const { viewer: coreViewer } = useViewer();

  // Cast to Cesium-specific viewer type
  const viewer = coreViewer as ViewerWithConfigs | null;

  const dataManager = useMemo(() => {
    if (!viewer) return null;
    try {
      return new DataManager(viewer);
    } catch (e) {
      console.error('Error creating DataManager:', e);
      return null;
    }
  }, [viewer]);

  // Run once on mount
  useEffect(() => {
    try {
      if (!dataManager || !viewer?.dataSources || !viewer?.layersConfig) return;
    } catch {
      return;
    }

    console.log('DataConnector creating/updating data');

    Object.entries(dataSource).forEach(([layerName, data]) => {
      if (Array.isArray(data) && viewer?.layersConfig?.getLayerConfig(layerName)) {
        data.forEach((item) => {
          dataManager.updateOrInsertDataItem(item, layerName);
        });
      }
    });
  }, [dataSource, dataManager, viewer]);

  // Run on dependency change (interval)
  useEffect(() => {
    try {
      if (!dataManager || !viewer?.dataSources || !viewer?.layersConfig) return;
    } catch {
      return;
    }

    const intervals: number[] = [];

    Object.keys(dataSource).forEach((layerName) => {
      const intervalMs = config.fetchIntervals?.[layerName] || config.fetchInterval || 0;
      if (intervalMs > 0) {
        const interval = setInterval(() => {
          const data = dataSource[layerName];
          if (Array.isArray(data) && viewer?.layersConfig?.getLayerConfig(layerName)) {
            data.forEach((item) => {
              dataManager.updateOrInsertDataItem(item, layerName);
            });
          }
        }, intervalMs);
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [dataSource, config, dataManager, viewer]);

  return null;
}
