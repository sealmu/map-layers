import type { MapLibreFeature } from "@mprest/map-maplibre";

interface SelectionOverlayProps {
  isActive: boolean;
  sourceFeature?: MapLibreFeature;
}

export function SelectionOverlay({ isActive, sourceFeature }: SelectionOverlayProps) {
  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        textAlign: 'center',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '2px solid #007bff',
      }}
    >
      <div style={{ marginBottom: '5px', fontSize: '16px' }}>
        🎯 Selection Mode Active
      </div>
      <div style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'normal' }}>
        Source: {sourceFeature?.id || sourceFeature?.properties?.name || 'Unknown'}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 'normal' }}>
        Click on a target entity to complete selection
      </div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.8 }}>
        Click on empty space to cancel
      </div>
    </div>
  );
}
