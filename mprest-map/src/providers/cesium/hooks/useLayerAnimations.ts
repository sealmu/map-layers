import { useEffect } from "react";
import {
  Cartesian3,
  CallbackProperty,
  JulianDate,
  ReferenceFrame,
  PositionProperty,
} from "cesium";
import type { LayerAnimationOptions } from "../../../types";

export function useLayerAnimations({
  dataSourceRef,
  isActive,
  isVisible,
  durationMs = 1500,
  staggerMs = 50,
  heightOffset = 500_000,
}: LayerAnimationOptions) {
  useEffect(() => {
    const dataSource = dataSourceRef.current;
    if (!dataSource || !isActive || isVisible === false) return;

    const now = JulianDate.now();
    const entities = dataSource.entities.values;
    const baseStart = Date.now();

    entities.forEach((entity, index) => {
      const startTime = baseStart + index * staggerMs;

      // Points / labels
      if (entity.position) {
        const originalPosition = entity.position.getValue(now);
        if (originalPosition) {
          const normal = Cartesian3.normalize(
            originalPosition,
            new Cartesian3(),
          );
          const offset = Cartesian3.multiplyByScalar(
            normal,
            heightOffset,
            new Cartesian3(),
          );
          const elevatedPos = Cartesian3.add(
            originalPosition,
            offset,
            new Cartesian3(),
          );

          const callbackProperty = new CallbackProperty(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const result = new Cartesian3();
            Cartesian3.lerp(elevatedPos, originalPosition, eased, result);
            return result;
          }, false);

          (callbackProperty as unknown as PositionProperty).referenceFrame =
            ReferenceFrame.FIXED;
          (
            callbackProperty as unknown as PositionProperty
          ).getValueInReferenceFrame = function (
            time: JulianDate,
            _referenceFrame: ReferenceFrame,
            result?: Cartesian3,
          ) {
              return this.getValue(time, result);
            };

          entity.position = callbackProperty as unknown as PositionProperty;
        }
      }

      // Polylines
      if (entity.polyline && entity.polyline.positions) {
        const originalPositions = entity.polyline.positions.getValue(now);
        if (Array.isArray(originalPositions) && originalPositions.length > 0) {
          const elevatedPositions = originalPositions.map((pos: Cartesian3) => {
            const normal = Cartesian3.normalize(pos, new Cartesian3());
            const offset = Cartesian3.multiplyByScalar(
              normal,
              heightOffset,
              new Cartesian3(),
            );
            return Cartesian3.add(pos, offset, new Cartesian3());
          });

          entity.polyline.positions = new CallbackProperty(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            return originalPositions.map(
              (originalPos: Cartesian3, i: number) => {
                const result = new Cartesian3();
                Cartesian3.lerp(
                  elevatedPositions[i],
                  originalPos,
                  eased,
                  result,
                );
                return result;
              },
            );
          }, false);
        }
      }

      // Polygons (animate via height for reliability)
      if (entity.polygon) {
        let animationComplete = false;

        entity.polygon.height = new CallbackProperty(() => {
          if (animationComplete) return 0;

          const elapsed = Date.now() - startTime;
          const progress = Math.min(Math.max(elapsed / durationMs, 0), 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          if (progress >= 1) {
            animationComplete = true;
            return 0;
          }

          return heightOffset * (1 - eased);
        }, false);
      }
    });
  }, [dataSourceRef, isActive, isVisible, durationMs, staggerMs, heightOffset]);
}
