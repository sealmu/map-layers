

interface FilterConfigType {
  isDisplayed?: boolean;
  isEnabled?: boolean;
  isHidden?: boolean;
  initialVisibility?: boolean;
}

interface FilterConfig {
  isDisplayed?: boolean;
  isEnabled?: boolean;
  types?: Record<string, FilterConfigType>;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterData: Record<string, { types: Record<string, boolean>; layerType?: string; hasDataSource?: boolean; isVisible?: boolean; isActive?: boolean; displayName: string; filterConfig?: FilterConfig }>;
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
              .filter(([, layerData]) => layerData.filterConfig?.isDisplayed !== false)
              .sort(([, a], [, b]) => {
                const aEnabled = (a.isVisible !== false) && (a.isActive !== false);
                const bEnabled = (b.isVisible !== false) && (b.isActive !== false);
                const aHasData = Object.keys(a.types).length > 0;
                const bHasData = Object.keys(b.types).length > 0;

                // Priority: enabled with data > enabled without data > disabled
                const getPriority = (enabled: boolean, hasData: boolean) => {
                  if (!enabled) return 0;
                  return hasData ? 2 : 1;
                };

                const aPriority = getPriority(aEnabled, aHasData);
                const bPriority = getPriority(bEnabled, bHasData);

                return bPriority - aPriority;
              })
              .map(([layerName, layerData]) => {
                const { types, isVisible = true, isActive = true, displayName, filterConfig } = layerData;
                const layerFilterDisabled = filterConfig?.isEnabled === false;
                const typeConfigs = filterConfig?.types;
                const visibleTypes = Object.fromEntries(
                  Object.entries(types).filter(([type]) =>
                    typeConfigs?.[type]?.isDisplayed !== false && typeConfigs?.[type]?.isHidden !== true
                  )
                );
                const allTypes = Object.keys(visibleTypes);
                const allVisible = allTypes.every(type => visibleTypes[type]);
                const isInactive = !isVisible || !isActive;
                const isDisabled = isInactive || layerFilterDisabled;

                return (
                  <div
                    key={layerName}
                    style={{
                      padding: '16px 20px',
                      background: isInactive
                        ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: `1px solid ${isInactive ? '#ccc' : '#e9ecef'}`,
                      borderRadius: '12px',
                      boxShadow: isInactive
                        ? '0 1px 4px rgba(0, 0, 0, 0.04)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      opacity: isInactive ? 0.6 : 1,
                      pointerEvents: isInactive ? 'none' : 'auto',
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
                            {isVisible && isActive ? 'No data yet' : 'Disabled'}
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
                                  background: isInactive
                                    ? '#f5f5f5'
                                    : allVisible ? '#4caf50' : 'rgba(76, 175, 80, 0.05)',
                                  color: isInactive ? '#999' : allVisible ? 'white' : '#4caf50',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s ease',
                                  minWidth: '70px',
                                  textAlign: 'center',
                                  boxShadow: isInactive
                                    ? 'none'
                                    : allVisible ? '0 2px 6px rgba(76, 175, 80, 0.3)' : 'none',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  opacity: layerFilterDisabled ? 0.6 : 1,
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
                            {Object.entries(visibleTypes).map(([type, isVisible]) => {
                              const typeConfigDisabled = typeConfigs?.[type]?.isEnabled === false;
                              const typeDisabled = isDisabled || typeConfigDisabled;
                              const typeInactive = isInactive;
                              return (
                              <button
                                key={type}
                                disabled={typeDisabled}
                                onClick={() => onFilterChange(layerName, displayName, type, !isVisible)}
                                style={{
                                  padding: '6px 12px',
                                  border: '1px solid #2196f3',
                                  borderRadius: '8px',
                                  background: typeInactive
                                    ? '#f5f5f5'
                                    : isVisible ? '#2196f3' : 'rgba(33, 150, 243, 0.05)',
                                  color: typeInactive ? '#999' : isVisible ? 'white' : '#2196f3',
                                  cursor: typeDisabled ? 'not-allowed' : 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s ease',
                                  minWidth: '70px',
                                  textAlign: 'center',
                                  boxShadow: typeInactive
                                    ? 'none'
                                    : isVisible ? '0 2px 6px rgba(33, 150, 243, 0.3)' : 'none',
                                  textTransform: 'capitalize',
                                  opacity: (layerFilterDisabled || typeConfigDisabled) ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (!typeDisabled) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                {type}
                              </button>
                              );
                            })}
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