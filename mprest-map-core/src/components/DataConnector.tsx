import { useEffect } from "react";
import { useViewer } from "../hooks/useViewer";
import type { ILayerData, IDataConnectorConfig } from "../types";

export interface DataConnectorProps<T = ILayerData> {
  dataSource: Record<string, T[]>;
  config: IDataConnectorConfig;
}

/**
 * Provider-agnostic DataConnector component.
 * Connects external data sources to map layers using the IDataManager interface.
 *
 * @template T - The layer data type. Defaults to ILayerData for provider-agnostic usage.
 *               For Cesium, you can use LayerData which includes Cartesian3 positions.
 *
 * @example
 * // Provider-agnostic usage with ILayerData
 * <DataConnector dataSource={agnosticData} config={config} />
 *
 * @example
 * // Cesium-specific usage with LayerData
 * <DataConnector<LayerData> dataSource={cesiumData} config={config} />
 */
export function DataConnector<T = ILayerData>({ dataSource, config }: DataConnectorProps<T>) {
  const { viewer } = useViewer();

  const dataManager = viewer?.dataManager;

  // Run once on mount and when dataSource changes
  useEffect(() => {
    if (!dataManager || !viewer?.layersConfig) return;

    Object.entries(dataSource).forEach(([layerName, data]) => {
      if (Array.isArray(data) && viewer.layersConfig.getLayerConfig(layerName)) {
        data.forEach((item) => {
          dataManager.updateOrInsertDataItem(item, layerName);
        });
      }
    });
  }, [dataSource, dataManager, viewer]);

  // Run on dependency change (interval)
  useEffect(() => {
    if (!dataManager || !viewer?.layersConfig) return;

    const intervals: number[] = [];

    Object.keys(dataSource).forEach((layerName) => {
      const intervalMs = config.fetchIntervals?.[layerName] || config.fetchInterval || 0;
      if (intervalMs > 0) {
        const interval = window.setInterval(() => {
          const data = dataSource[layerName];
          if (Array.isArray(data) && viewer.layersConfig.getLayerConfig(layerName)) {
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
