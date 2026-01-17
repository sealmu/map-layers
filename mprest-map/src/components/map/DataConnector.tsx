import { useEffect, useMemo } from "react";
import { DataManager, useViewer, type ViewerWithConfigs, type DataConnectorProps } from "@mprest/map";

export function DataConnector({ dataSource, config }: DataConnectorProps) {
  const { viewer } = useViewer();

  const dataManager = useMemo(() => {
    if (!viewer) return null;
    try {
      return new DataManager(viewer as ViewerWithConfigs);
    } catch (e) {
      console.error('Error creating DataManager:', e);
      return null;
    }
  }, [viewer]);

  // Run once on mount
  useEffect(() => {
    try {
      if (!dataManager || !viewer?.dataSources) return;
    } catch {
      //console.error('Error checking viewer.dataSources:', e);
      return;
    }

    console.log('DataConnector creating/updating data');

    Object.entries(dataSource).forEach(([layerName, data]) => {
      if (Array.isArray(data)) {
        data.forEach((item) => {
          dataManager.updateOrInsertDataItem(item, layerName);
        });
      }
    });
  }, [dataSource, dataManager, viewer]); // Re-run when dataSource, dataManager, or viewer changes

  // Run on dependency change (interval)
  useEffect(() => {
    try {
      if (!dataManager || !viewer?.dataSources) return;
    } catch {
      //console.error('Error checking viewer.dataSources in interval useEffect:', e);
      return;
    }

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
  }, [dataSource, config, dataManager, viewer]); // Re-run when dataSource, config, dataManager, or viewer changes

  return null;
}