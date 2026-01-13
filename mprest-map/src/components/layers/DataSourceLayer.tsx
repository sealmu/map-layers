import { useEffect, useRef } from 'react';
import { CustomDataSource as CesiumCustomDataSource } from 'cesium';
// import { createEntityFromData } from "../../helpers/pipeline";
// import { useLayerAnimations } from "./hooks/useLayerAnimations";
import type {
  DataSourceLayerProps,
  RendererRegistry,
  // LayerData,
} from '../../types';

const DataSourceLayer = <R extends RendererRegistry>({ viewer }: DataSourceLayerProps<R>) => {
  const _dataSourceRef = useRef<CesiumCustomDataSource | null>(null);
  const _dataSourcePromiseRef = useRef<Promise<CesiumCustomDataSource> | null>(null);

  // Helper to get current dataSource instance
  // const getDataSourceInstance = useCallback(() => dataSourceRef.current, []);

  // // Helper to set dataSource instance
  // const setDataSourceInstance = (dataSource: CesiumCustomDataSource | null) => {
  //   dataSourceRef.current = dataSource;
  // };

  // const clearDataSourceInstance = useCallback(() => {
  //   dataSourceRef.current = null;
  // }, []);

  // useLayerAnimations({
  //   dataSourceRef,
  //   isActive: animateActivation ? isActive : false,
  //   isVisible: animateVisibility ? isVisible : undefined,
  //   durationMs: 1500,
  //   staggerMs: 50,
  //   heightOffset: 500000,
  // });

  // Initialize data source once on mount, cleanup on unmount
  useEffect(() => {
    if (!viewer && !_dataSourceRef.current && !_dataSourcePromiseRef.current) return;

    const dataSource = new CesiumCustomDataSource('');
    _dataSourceRef.current = dataSource;

    _dataSourcePromiseRef.current = viewer.dataSources.add(dataSource);

    _dataSourcePromiseRef.current
      .then(() => {
        _dataSourcePromiseRef.current = null;
      })
      .catch((error) => {
        console.error('Failed to add dataSource:', error);
      });

    // Cleanup only on unmount
    return () => {
      if (!viewer.isDestroyed() || (!_dataSourceRef.current && !_dataSourcePromiseRef.current)) {
        if (_dataSourcePromiseRef.current) {
          _dataSourcePromiseRef.current
            ?.then((dataSource: CesiumCustomDataSource) => {
              if (viewer.dataSources.contains(dataSource)) {
                viewer.dataSources.remove(dataSource, true);
              }

              _dataSourcePromiseRef.current = null;
              _dataSourceRef.current = null;
            })
            .catch((error) => {
              console.error('Failed to remove dataSource during cleanup:', error);
            });
        }

        if (viewer.dataSources.contains(_dataSourceRef.current!)) {
          viewer.dataSources.remove(_dataSourceRef.current!, true);
        }
        _dataSourceRef.current = null;
      }
    };
  }, [viewer]);

  // Update name when it changes
  // useEffect(() => {
  //   const dataSourceInstance = getDataSourceInstance();
  //   if (!dataSourceInstance) return;

  //   dataSourceInstance.name = id;
  // // }, [id, getDataSourceInstance]);

  // Update show flag without adding/removing the data source
  // useEffect(() => {
  //   const dataSourceInstance = getDataSourceInstance();
  //   if (!dataSourceInstance) return;

  //   dataSourceInstance.show = (isVisible && isActive) ?? true;
  // }, [isVisible, isActive, getDataSourceInstance]);

  // Clear entities when layer is deactivated
  // useEffect(() => {
  //   const dataSourceInstance = getDataSourceInstance();
  //   if (!dataSourceInstance) return;

  //   if (!isActive) {
  //     dataSourceInstance.entities.removeAll();
  //   }
  // }, [isActive, getDataSourceInstance]);

  // Update entities when data or type changes
  // useEffect(() => {
  //   const dataSourceInstance = getDataSourceInstance();
  //   if (!dataSourceInstance || !viewer) return;

  //   // Clear and repopulate entities
  //   dataSourceInstance.entities.removeAll();

  //   if (data && data.length > 0) {
  //     data.forEach((item: LayerData) => {
  //       // If customRenderer is provided, apply it to the item
  //       const itemWithRenderer = customRenderer
  //         ? { ...item, customRenderer }
  //         : item;

  //       // Check if onEntityCreate callback is provided
  //       let entityOptions: Entity.ConstructorOptions | null = null;
  //       if (viewer.mapref.onEntityCreate) {
  //         entityOptions = viewer.mapref.onEntityCreate(
  //           type,
  //           itemWithRenderer,
  //           renderers,
  //           id,
  //         );
  //       }

  //       // If callback didn't provide options, use createEntityFromData
  //       if (!entityOptions) {
  //         entityOptions = createEntityFromData(
  //           type,
  //           itemWithRenderer,
  //           renderers,
  //           id,
  //           viewer.mapref.onEntityCreating,
  //         );
  //       }
  //       if (entityOptions) {
  //         const entity = dataSourceInstance.entities.add(entityOptions);

  //         // Apply current filter state to the new entity
  //         if (entity && viewer.filters) {
  //           const rendererType = entity.properties?.rendererType?.getValue();
  //           if (rendererType) {
  //             entity.show = viewer.filters.filterData[id]?.types[rendererType] ?? true;
  //           }
  //         }
  //       }
  //     });
  //   }
  // }, [data, type, customRenderer, renderers, getDataSourceInstance, viewer, id]);

  // Update enabled(active) by removing/adding dataSource from viewer
  // useEffect(() => {
  //   const dataSourceInstance = getDataSourceInstance();
  //   if (!dataSourceInstance || !viewer) return;

  //   const shouldShow = isActive ?? true;
  //   let cancelled = false;
  //   let addPromise: Promise<void> | null = null;

  //   const updateActivation = async () => {
  //     if (shouldShow) {
  //       // Recreate data source if it was destroyed
  //       let currentDataSource = getDataSourceInstance();
  //       if (!currentDataSource || (currentDataSource as any).isDestroyed) {
  //         const newDataSource = new CesiumCustomDataSource("");
  //         newDataSource.name = id;
  //         setDataSourceInstance(newDataSource);
  //         currentDataSource = newDataSource;
  //       }

  //       if (!viewer.dataSources.contains(currentDataSource)) {
  //         try {
  //           await viewer.dataSources.add(currentDataSource);
  //         } catch (error) {
  //           if (!cancelled) {
  //             console.error("Failed to add dataSource:", error);
  //           }
  //         }
  //       }
  //     } else {
  //       const currentDataSource = getDataSourceInstance();
  //       if (currentDataSource && viewer.dataSources.contains(currentDataSource)) {
  //         viewer.dataSources.remove(currentDataSource, true); // Destroy the data source
  //         clearDataSourceInstance();
  //       }
  //     }
  //   };

  //   addPromise = updateActivation();

  //   return () => {
  //     cancelled = true;
  //     if (addPromise && shouldShow) {
  //       addPromise.then(() => {
  //         const currentDs = getDataSourceInstance();
  //         if (
  //           currentDs &&
  //           !viewer.isDestroyed() &&
  //           viewer.dataSources.contains(currentDs) &&
  //           !(currentDs as any).isDestroyed
  //         ) {
  //           viewer.dataSources.remove(currentDs, false);
  //         }
  //       });
  //     }
  //   };
  // }, [isActive, viewer, getDataSourceInstance, clearDataSourceInstance, id]);

  return null;
};

export default DataSourceLayer;
