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

    const interval = setInterval(() => {
      runDataConnectorLogic();
    }, config.fetchInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [dataManager, config.fetchInterval, runDataConnectorLogic]);

  return null;
}