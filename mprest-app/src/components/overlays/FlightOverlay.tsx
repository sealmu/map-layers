interface FlightOverlayProps {
  isAnimating: boolean;
  sourceId?: string | null;
  targetId?: string | null;
  progress: number;
  onCancel: () => void;
}

export function FlightOverlay({ isAnimating, sourceId, targetId, progress, onCancel }: FlightOverlayProps) {
  if (!isAnimating) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 100, 0, 0.9)',
        color: 'white',
        padding: '15px 25px',
        borderRadius: '10px',
        textAlign: 'center',
        zIndex: 1001,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '2px solid #00ff00',
        minWidth: '250px',
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '18px' }}>
        Drone in Flight
      </div>
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'normal' }}>
        {sourceId} → {targetId}
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: '#00ff00',
            borderRadius: '4px',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'normal' }}>
        {Math.round(progress * 100)}% complete
      </div>
      <button
        onClick={onCancel}
        style={{
          marginTop: '10px',
          padding: '5px 15px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Cancel Flight
      </button>
    </div>
  );
}
