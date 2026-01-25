/* eslint-disable react-hooks/set-state-in-effect */
import type { StickyEntityInfo } from "../../plugins/StickyInfoPlugin";
import { calcStickyInfoPosition } from "./helpers";
import { useState, useEffect } from "react";

interface StickyPopupsProps {
  stickyInfoMap: Map<string, StickyEntityInfo>;
  onClose: (entityId: string) => void;
}

export function StickyPopups({ stickyInfoMap, onClose }: StickyPopupsProps) {
  const [initialPositions, setInitialPositions] = useState<Map<string, { left: number; top: number }>>(new Map());

  useEffect(() => {
    setInitialPositions(prev => {
      const newMap = new Map(prev);
      for (const [entityId, info] of stickyInfoMap.entries()) {
        if (!newMap.has(entityId)) {
          const calcPos = calcStickyInfoPosition(info);
          if (calcPos) {
            newMap.set(entityId, calcPos);
          }
        }
      }
      // Remove positions for entities no longer in the map
      for (const id of Array.from(newMap.keys())) {
        if (!stickyInfoMap.has(id)) {
          newMap.delete(id);
        }
      }
      return newMap;
    });
  }, [stickyInfoMap]);

  return (
    <>
      {Array.from(stickyInfoMap.entries()).map(([entityId, info]) => {
        const position = info.isSticky ? calcStickyInfoPosition(info) : initialPositions.get(entityId);
        if (!position) return null;
        return (
          <div
            key={entityId}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              backgroundColor: 'rgba(0, 50, 100, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              minWidth: '200px',
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 3001,
              pointerEvents: 'auto',
              border: '2px solid #00aaff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px' }}>Tracking: {info.entity.name || info.entity.id}</h3>
              <button
                onClick={() => onClose(entityId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div><strong>ID:</strong> {info.entity.id}</div>
              {info.location && (
                <>
                  <div><strong>Lat:</strong> {info.location.latitude.toFixed(6)}°</div>
                  <div><strong>Lon:</strong> {info.location.longitude.toFixed(6)}°</div>
                  <div><strong>Alt:</strong> {info.location.height.toFixed(2)}m</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
