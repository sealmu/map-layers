

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filterData: Record<string, { types: Record<string, boolean>; layerType?: string }>;
    onFilterChange: (layerName: string, type: string, visible: boolean) => void;
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
                    padding: '20px',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    maxHeight: '80%',
                    overflow: 'auto',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Filter Layers by Type</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(filterData)
                        .filter(([, layerData]) => Object.keys(layerData.types).length > 0)
                        .map(([layerName, layerData]) => {
                            const { types, layerType } = layerData;
                            const allTypes = Object.keys(types);
                            const allVisible = allTypes.every(type => types[type]);

                            // Only show individual type buttons if there are multiple types OR types differ from layer type
                            const showIndividualButtons = allTypes.length > 1 || (layerType && allTypes.some(type => type !== layerType));

                            return (
                                <div
                                    key={layerName}
                                    style={{
                                        padding: '16px 20px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                        transition: 'all 0.3s ease',
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
                                            {layerName}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                            flex: 1,
                                            alignItems: 'center',
                                        }}>
                                            <button
                                                onClick={() => {
                                                    const newState = !allVisible;
                                                    allTypes.forEach(type => {
                                                        onFilterChange(layerName, type, newState);
                                                    });
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: '2px solid #4caf50',
                                                    borderRadius: '8px',
                                                    background: allVisible ? '#4caf50' : 'rgba(76, 175, 80, 0.05)',
                                                    color: allVisible ? 'white' : '#4caf50',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s ease',
                                                    minWidth: '70px',
                                                    textAlign: 'center',
                                                    boxShadow: allVisible ? '0 2px 6px rgba(76, 175, 80, 0.3)' : 'none',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                All
                                            </button>
                                            {showIndividualButtons && Object.entries(types).map(([type, isVisible]) => (
                                                <button
                                                    key={type}
                                                    onClick={() => onFilterChange(layerName, type, !isVisible)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        border: '1px solid #2196f3',
                                                        borderRadius: '8px',
                                                        background: isVisible ? '#2196f3' : 'rgba(33, 150, 243, 0.05)',
                                                        color: isVisible ? 'white' : '#2196f3',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        transition: 'all 0.2s ease',
                                                        minWidth: '70px',
                                                        textAlign: 'center',
                                                        boxShadow: isVisible ? '0 2px 6px rgba(33, 150, 243, 0.3)' : 'none',
                                                        textTransform: 'capitalize',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px 12px',
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;