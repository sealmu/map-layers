import { useState } from "react";
import type { SearchData } from "@mprest/map";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchData: SearchData;
  filterData: Record<string, { types: Record<string, boolean> }>;
  globalFilterData: Record<string, { types: Record<string, boolean> }>;
  searchResults: Array<{
    id: string;
    name: string;
    layerId: string;
    renderType?: string;
  }>;
  searchQuery: string;
  onLayerToggle: (layerName: string, enabled: boolean) => void;
  onTypeToggle?: (layerId: string, type: string, enabled: boolean) => void;
  onSearch: (query: string) => void;
  onSelectEntity?: (entityId: string, layerId: string, flyTo?: boolean | number) => void;
};

const SearchModal = ({
  isOpen,
  onClose,
  searchData,
  filterData,
  globalFilterData,
  searchResults,
  searchQuery,
  onLayerToggle,
  onTypeToggle,
  onSearch,
  onSelectEntity,
}: SearchModalProps) => {
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onSearch(newQuery);
  };

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
          maxWidth: '700px',
          maxHeight: '80%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header: Title, Search Box, and Layer Toggles */}
        <div style={{ padding: '20px', paddingBottom: '0', flexShrink: 0 }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Search Entities</h3>

          {/* Search Box */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2196f3';
                e.target.style.boxShadow = '0 0 0 2px rgba(33, 150, 243, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>

          {/* Layer Toggles */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              Search in Layers:
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center'
            }}>
              {Object.entries(searchData).map(([layerName, layerData]) => {
                const { displayName } = layerData;
                const isDisabled = !layerData.hasDataSource || !layerData.isVisible || layerData.enabledTypesCount === 0;
                return (
                  <div
                    key={layerName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    <span style={{
                      fontSize: '12px',
                      color: isDisabled ? '#999' : '#2c3e50',
                      whiteSpace: 'nowrap',
                    }}>
                      {displayName}
                    </span>
                    <div
                      onClick={() => !isDisabled && onLayerToggle(layerName, !layerData.enabled)}
                      style={{
                        position: 'relative',
                        width: '36px',
                        height: '20px',
                        background: isDisabled
                          ? '#ccc'
                          : layerData.enabled ? '#4caf50' : '#ccc',
                        borderRadius: '10px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s ease',
                        border: '1px solid #ddd',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: layerData.enabled ? '18px' : '2px',
                          width: '14px',
                          height: '14px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                    </div>
                    {layerData.enabled && (() => {
                      const visibleTypes = Array.from(layerData.types).filter(type => globalFilterData[layerName]?.types[type] ?? true);
                      return visibleTypes.length > 1;
                    })() && (
                        <>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: '#2196f3',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              verticalAlign: 'middle',
                            }}
                            title={`Expandable: ${(() => {
                              const totalTypes = layerData.types.size;
                              const available = Array.from(layerData.types).filter(type => globalFilterData[layerName]?.types[type] ?? true).length;
                              const enabledInSearch = Array.from(layerData.types).filter(type => (filterData[layerName]?.types[type] ?? true) && (globalFilterData[layerName]?.types[type] ?? true)).length;
                              const countStr = enabledInSearch < available ? (available === totalTypes ? `${enabledInSearch}/${available}` : `${enabledInSearch}/${available}(${totalTypes})`) : available === totalTypes ? `${enabledInSearch}` : `${enabledInSearch}(${totalTypes})`;
                              return countStr;
                            })()} types`}
                            onClick={() => setExpandedLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }))}
                          >
                            <span>{(() => {
                              const totalTypes = layerData.types.size;
                              const available = Array.from(layerData.types).filter(type => globalFilterData[layerName]?.types[type] ?? true).length;
                              const enabledInSearch = Array.from(layerData.types).filter(type => (filterData[layerName]?.types[type] ?? true) && (globalFilterData[layerName]?.types[type] ?? true)).length;
                              return enabledInSearch < available ? (available === totalTypes ? `${enabledInSearch}/${available}` : `${enabledInSearch}/${available}(${totalTypes})`) : available === totalTypes ? `${enabledInSearch}` : `${enabledInSearch}(${totalTypes})`;
                            })()}</span><span>▶</span>
                          </span>
                          {expandedLayers[layerName] && (
                            <>
                              {Array.from(layerData.types).filter(type => globalFilterData[layerName]?.types[type] ?? true).map(type => {
                                const isEnabled = filterData[layerName]?.types[type] ?? true;
                                return (
                                  <span
                                    key={type}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '12px',
                                      fontSize: '14px',
                                      fontWeight: 'bold',
                                      background: isEnabled ? '#ff5722' : '#ccc',
                                      color: 'white',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      marginLeft: '4px',
                                    }}
                                    onClick={() => onTypeToggle?.(layerName, type, !isEnabled)}
                                    title={`${isEnabled ? 'Disable' : 'Enable'} ${type}`}
                                  >
                                    {type}
                                  </span>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Results Area */}
        {searchQuery.trim() && (
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            padding: '0 20px',
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666', flexShrink: 0 }}>
              Results ({searchResults.length}):
            </h4>
            {searchResults.length > 0 ? (
              <div style={{
                flex: 1,
                overflow: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                marginBottom: '10px',
              }}>
                {searchResults.map((result) => (
                  <div
                    key={`${result.layerId}-${result.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderBottom: '1px solid #f1f3f4',
                      background: '#ffffff',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      // Prevent row click if eye icon was clicked
                      if ((e.target as HTMLElement).closest('.eye-icon')) return;
                      onSelectEntity?.(result.id, result.layerId, false);
                      onClose();
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2c3e50',
                      }}>
                        {result.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        ID: {result.id}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        {result.layerId}
                      </span>
                      <button
                        className="eye-icon"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '3px',
                          color: '#666',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntity?.(result.id, result.layerId, 1000000);
                          onClose();
                        }}
                        title="Select and fly to entity"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic',
              }}>
                No entities found
              </div>
            )}
          </div>
        )}

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

export default SearchModal;