import { useEffect } from "react";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchData: Record<
        string,
        {
            enabled: boolean;
            hasDataSource?: boolean;
            isVisible?: boolean;
            entities: Array<{
                id: string;
                name: string;
                layerId: string;
            }>;
            displayName: string;
        }
    >;
    searchResults: Array<{
        id: string;
        name: string;
        layerId: string;
    }>;
    searchQuery: string;
    onLayerToggle: (layerName: string, enabled: boolean) => void;
    onSearch: (query: string) => void;
    onSelectEntity?: (entityId: string, layerId: string, flyTo?: boolean | number) => void;
}

const SearchModal = ({
    isOpen,
    onClose,
    searchData,
    searchResults,
    searchQuery,
    onLayerToggle,
    onSearch,
    onSelectEntity,
}: SearchModalProps) => {
    // Re-run search when layer toggles change
    useEffect(() => {
        if (searchQuery.trim()) {
            onSearch(searchQuery);
        }
    }, [searchData, onSearch, searchQuery]);

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
                <div style={{ padding: '20px', paddingBottom: '0' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Search Entities</h3>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    padding: '0 20px 0 20px',
                }}>
                    {/* Search Box */}
                    <div style={{ marginBottom: '20px', paddingTop: '20px' }}>
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
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            {Object.entries(searchData).map(([layerName, layerData]) => {
                                const { displayName } = layerData;
                                const isDisabled = !layerData.hasDataSource || !layerData.isVisible;
                                return (
                                    <div
                                        key={layerName}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
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
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() && (
                        <div>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                                Results ({searchResults.length}):
                            </h4>
                            {searchResults.length > 0 ? (
                                <div style={{
                                    maxHeight: '300px',
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
                                                {/* <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: '#2196f3', // Bullet color, could be based on layer
                                                }} /> */}
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

export default SearchModal;