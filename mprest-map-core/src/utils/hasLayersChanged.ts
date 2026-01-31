/**
 * Minimal interface for layer comparison
 */
interface ComparableLayer {
    id: string;
    name?: string;
    type?: string;
    data?: unknown;
    isDocked?: boolean;
    isActive?: boolean;
    isVisible?: boolean;
}

/**
 * Compares two layer arrays to check if they have changed
 * @param newLayers - New layer array
 * @param prevLayers - Previous layer array
 * @returns true if layers have changed, false otherwise
 */
export default function hasLayersChanged<T extends ComparableLayer>(
    newLayers: T[],
    prevLayers: T[]
): boolean {
    if (newLayers.length !== prevLayers.length) return true;

    return newLayers.some((layer, i) => {
        if (i >= prevLayers.length) return true;
        const prev = prevLayers[i];
        return (
            layer.id !== prev.id ||
            layer.name !== prev.name ||
            layer.type !== prev.type ||
            layer.data !== prev.data ||
            layer.isDocked !== prev.isDocked ||
            layer.isActive !== prev.isActive ||
            layer.isVisible !== prev.isVisible
        );
    });
}