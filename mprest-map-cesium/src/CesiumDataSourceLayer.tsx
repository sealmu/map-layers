import { useEffect, useRef, useCallback } from "react";
import { CustomDataSource as CesiumCustomDataSource, Entity, EntityCollection } from "cesium";
import { createLogger } from "@mprest/map-core";
import { createEntityFromData } from "./pipeline";
import { useLayerAnimations } from "./hooks/useLayerAnimations";
import type {
  DataSourceLayerProps,
  RendererRegistry,
  LayerData,
  EntityChangeStatus,
} from "./types";

const logger = createLogger("CesiumDataSourceLayer");

const CesiumDataSourceLayer = <R extends RendererRegistry>({
  viewer,
  id,
  type,
  data,
  isActive,
  isVisible,
  customRenderer,
  renderers,
  animateActivation = false,
  animateVisibility = false,
  onEntityChange,
  onEntityCreating,
  onEntityCreate,
}: DataSourceLayerProps<R>) => {
  const dataSourceRef = useRef<CesiumCustomDataSource | null>(null);

  // Store callbacks in refs to avoid triggering entity rebuild on reference changes
  const onEntityChangeRef = useRef(onEntityChange);
  const onEntityCreatingRef = useRef(onEntityCreating);
  const onEntityCreateRef = useRef(onEntityCreate);
  onEntityChangeRef.current = onEntityChange;
  onEntityCreatingRef.current = onEntityCreating;
  onEntityCreateRef.current = onEntityCreate;

  // Helper to get current dataSource instance
  const getDataSourceInstance = useCallback(() => dataSourceRef.current, []);

  // Helper to set dataSource instance
  const setDataSourceInstance = (dataSource: CesiumCustomDataSource | null) => {
    dataSourceRef.current = dataSource;
  };

  useLayerAnimations({
    dataSourceRef,
    isActive: animateActivation ? isActive : false,
    isVisible: animateVisibility ? isVisible : undefined,
    durationMs: 1500,
    staggerMs: 50,
    heightOffset: 500000,
  });

  // Initialize data source once on mount, cleanup on unmount
  useEffect(() => {
    if (!viewer) return;

    const dataSource = new CesiumCustomDataSource("");
    setDataSourceInstance(dataSource);

    // Add event listener for entity changes
    const onEntityChangeCallback = (_collection: EntityCollection, _added: Entity[], _removed: Entity[], _changed: Entity[]) => {
      _added.forEach(entity => onEntityChangeRef.current?.(entity, 'added' as EntityChangeStatus, id));
      _removed.forEach(entity => onEntityChangeRef.current?.(entity, 'removed' as EntityChangeStatus, id));
      _changed.forEach(entity => onEntityChangeRef.current?.(entity, 'changed' as EntityChangeStatus, id));
    };
    dataSource.entities.collectionChanged.addEventListener(onEntityChangeCallback);

    // Cleanup only on unmount
    return () => {
      const dataSourceInstance = getDataSourceInstance();
      if (dataSourceInstance && !viewer.isDestroyed()) {
        // Remove event listener
        dataSource.entities.collectionChanged.removeEventListener(onEntityChangeCallback);
        // Remove from viewer if it's there
        if (viewer.dataSources.contains(dataSourceInstance)) {
          viewer.dataSources.remove(dataSourceInstance, true);
        }
        setDataSourceInstance(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, getDataSourceInstance, id]);

  // Update name when it changes
  useEffect(() => {
    const dataSourceInstance = getDataSourceInstance();
    if (!dataSourceInstance) return;

    dataSourceInstance.name = id;
  }, [id, getDataSourceInstance]);

  // Update show flag without adding/removing the data source
  useEffect(() => {
    const dataSourceInstance = getDataSourceInstance();
    if (!dataSourceInstance) return;

    dataSourceInstance.show = isVisible ?? true;
  }, [isVisible, getDataSourceInstance]);

  // Update entities when data or type changes
  useEffect(() => {
    const dataSourceInstance = getDataSourceInstance();
    if (!dataSourceInstance || !viewer) return;

    // Clear and repopulate entities
    dataSourceInstance.entities.removeAll();

    if (data && data.length > 0) {
      data.forEach((item: LayerData) => {
        // If customRenderer is provided, apply it to the item
        const itemWithRenderer = customRenderer
          ? { ...item, customRenderer }
          : item;

        // Call onEntityCreate - first non-null result wins
        let entityOptions: Entity.ConstructorOptions | null = null;
        if (onEntityCreateRef.current) {
          entityOptions = onEntityCreateRef.current(type, itemWithRenderer, renderers, id);
        }

        // If no result, use createEntityFromData
        if (!entityOptions) {
          entityOptions = createEntityFromData(
            type,
            itemWithRenderer,
            renderers,
            id,
            onEntityCreatingRef.current,
          );
        }
        if (entityOptions) {
          const entity = dataSourceInstance.entities.add(entityOptions);

          // Apply current filter state to the new entity
          if (entity && viewer.api?.filters) {
            const rendererType = entity.properties?.rendererType?.getValue();
            if (rendererType) {
              entity.show = viewer.api.filters.filterData[id]?.types[rendererType] ?? true;
            }
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, type, customRenderer, renderers, getDataSourceInstance, viewer, id]);

  // Update enabled(active) by removing/adding dataSource from viewer
  useEffect(() => {
    const dataSourceInstance = getDataSourceInstance();
    if (!dataSourceInstance || !viewer) return;

    const shouldShow = isActive ?? true;
    let cancelled = false;
    let addPromise: Promise<void> | null = null;

    const updateActivation = async () => {
      if (shouldShow) {
        if (!viewer.dataSources.contains(dataSourceInstance)) {
          try {
            await viewer.dataSources.add(dataSourceInstance);
          } catch (error) {
            if (!cancelled) {
              logger.error("Failed to add dataSource", error instanceof Error ? error : undefined, { layerId: id });
            }
          }
        }
      } else {
        if (viewer.dataSources.contains(dataSourceInstance)) {
          viewer.dataSources.remove(dataSourceInstance, false);
        }
      }
    };

    addPromise = updateActivation();

    return () => {
      cancelled = true;
      if (addPromise && shouldShow) {
        addPromise.then(() => {
          if (
            dataSourceInstance &&
            !viewer.isDestroyed() &&
            viewer.dataSources.contains(dataSourceInstance)
          ) {
            viewer.dataSources.remove(dataSourceInstance, false);
          }
        });
      }
    };
  }, [isActive, viewer, getDataSourceInstance]);

  return null;
};

export default CesiumDataSourceLayer;
