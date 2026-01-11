import { useMemo, useEffect, useCallback } from "react";
import { DataManager } from "../../helpers/data/DataManager";
import { useViewer } from "../../hooks/useViewer";
import type { ViewerWithConfigs, DataConnectorProps } from "../../types";

export function DataConnector({ dataSource, config }: DataConnectorProps) {
  const { viewer } = useViewer();
  const dataManager = useMemo(
    () => (viewer ? new DataManager(viewer as ViewerWithConfigs) : null),
    [viewer],
  );

  // Logic encapsulated inside the component, memoized for useEffect
  const runDataConnectorLogic = useCallback(() => {
    if (!dataManager) return;

    Object.entries(dataSource).forEach(([layerName, data]) => {
      if (Array.isArray(data)) {
        data.forEach((item) => {
          dataManager.updateOrInsertDataItem(item, layerName);
        });
      }
    });

  }, [dataManager, dataSource]);

  // Run once on mount
  useEffect(() => {
    runDataConnectorLogic();
  }, [runDataConnectorLogic]);

  // Run on dependency change (interval)
  useEffect(() => {
    if (!dataManager) return;

    const intervals: number[] = [];

    Object.keys(dataSource).forEach((layerName) => {
      const intervalMs = config.fetchIntervals?.[layerName] || config.fetchInterval || 0;
      if (intervalMs > 0) {
        const interval = setInterval(() => {
          const data = dataSource[layerName];
          if (Array.isArray(data)) {
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
  }, [dataManager, config, dataSource]);

  return null;
}