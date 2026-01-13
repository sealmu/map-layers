

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterData: Record<string, { types: Record<string, boolean>; layerType?: string; hasDataSource?: boolean; isVisible?: boolean; isActive?: boolean; displayName: string }>;
  onFilterChange: (layerName: string, displayName: string, type: string, visible: boolean) => void;
}

const FilterModal = ({ isOpen, onClose, filterData, onFilterChange }: FilterModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          maxWidth: '600px',
          maxHeight: '80%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px', paddingBottom: '0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Filter Layers</h3>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 20px 0 20px',
          minHeight: 0, // Important for flexbox scrolling
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
            {Object.entries(filterData)
              .filter(() => true)
              .sort(([, a], [, b]) => {
                const aEnabled = (a.isVisible !== false) && (a.isActive !== false) && Object.keys(a.types).length > 0;
                const bEnabled = (b.isVisible !== false) && (b.isActive !== false) && Object.keys(b.types).length > 0;
                // Enabled layers first (true comes before false in sort)
                return Number(bEnabled) - Number(aEnabled);
              })
              .map(([layerName, layerData]) => {
                const { types, isVisible = true, isActive = true, displayName } = layerData;
                const allTypes = Object.keys(types);
                const allVisible = allTypes.every(type => types[type]);
                const isDisabled = !isVisible || !isActive || Object.keys(types).length === 0;

                return (
                  <div
                    key={layerName}
                    style={{
                      padding: '16px 20px',
                      background: isDisabled
                        ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: `1px solid ${isDisabled ? '#ccc' : '#e9ecef'}`,
                      borderRadius: '12px',
                      boxShadow: isDisabled
                        ? '0 1px 4px rgba(0, 0, 0, 0.04)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      opacity: isDisabled ? 0.6 : 1,
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2196f3';
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(33, 150, 243, 0.2), 0 4px 16px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    {/* Subtle background accent */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: allVisible ? '#4caf50' : '#2196f3',
                      borderRadius: '12px 0 0 12px',
                    }} />

                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '20px',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      <div style={{
                        fontWeight: '600',
                        minWidth: '140px',
                        color: '#2c3e50',
                        fontSize: '14px',
                        paddingTop: '4px',
                      }}>
                        {displayName}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        flex: 1,
                        alignItems: 'center',
                      }}>
                        {allTypes.length === 0 ? (
                          <div style={{
                            padding: '6px 12px',
                            background: '#f5f5f5',
                            color: '#999',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontStyle: 'italic',
                          }}>
                            Disabled
                          </div>
                        ) : (
                          <>
                            {allTypes.length > 1 && (
                              <button
                                disabled={isDisabled}
                                onClick={() => {
                                  const newState = !allVisible;
                                  allTypes.forEach(type => {
                                    onFilterChange(layerName, displayName, type, newState);
                                  });
                                }}
                                style={{
                                  padding: '6px 12px',
                                  border: '2px solid #4caf50',
                                  borderRadius: '8px',
                                  background: isDisabled
                                    ? '#f5f5f5'
                                    : allVisible ? '#4caf50' : 'rgba(76, 175, 80, 0.05)',
                                  color: isDisabled ? '#999' : allVisible ? 'white' : '#4caf50',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s ease',
                                  minWidth: '70px',
                                  textAlign: 'center',
                                  boxShadow: isDisabled
                                    ? 'none'
                                    : allVisible ? '0 2px 6px rgba(76, 175, 80, 0.3)' : 'none',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isDisabled) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isDisabled) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }
                                }}
                              >
                                All
                              </button>
                            )}
                            {Object.entries(types).map(([type, isVisible]) => (
                              <button
                                key={type}
                                disabled={isDisabled}
                                onClick={() => onFilterChange(layerName, displayName, type, !isVisible)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #2196f3',
                                  borderRadius: '8px',
                                  background: isDisabled
                                    ? '#f5f5f5'
                                    : isVisible ? '#2196f3' : 'rgba(33, 150, 243, 0.05)',
                                  color: isDisabled ? '#999' : isVisible ? 'white' : '#2196f3',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s ease',
                                  minWidth: '70px',
                                  textAlign: 'center',
                                  boxShadow: isDisabled
                                    ? 'none'
                                    : isVisible ? '0 2px 6px rgba(33, 150, 243, 0.3)' : 'none',
                                  textTransform: 'capitalize',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isDisabled) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                {type}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div style={{
          padding: '20px',
          paddingTop: '15px',
          borderTop: '1px solid #e9ecef',
          background: 'white',
          borderRadius: '0 0 8px 8px',
        }}>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1976d2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2196f3';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;