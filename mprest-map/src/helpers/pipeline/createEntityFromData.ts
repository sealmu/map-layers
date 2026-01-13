import { Entity } from "cesium";
import type {
    RendererRegistry,
    RenderTypeFromRegistry,
    LayerData,
} from "../../types";
import { enrichEntity } from "./enrichEntity";

// Main function to create entity from data based on type
export function createEntityFromData<R extends RendererRegistry>(
    type: RenderTypeFromRegistry<R>,
    item: LayerData,
    renderers: R,
    layerId?: string,
    onEntityCreating?: (options: Entity.ConstructorOptions) => void,
): Entity.ConstructorOptions | null {
    const registry = renderers;

    // For custom type, check item-level customRenderer or renderType
    if (type === "custom") {
        // Use item-level custom renderer if provided
        if (item.customRenderer) {
            const options = item.customRenderer(item);
            if (options) {
                enrichEntity(options, "custom", layerId);
                onEntityCreating?.(options);

                return options;
            }
        }
        // Use item-level renderType if provided
        if (item.renderType) {
            const renderer = registry[item.renderType];
            const options = renderer ? renderer(item) : null;
            if (options) {
                enrichEntity(options, item.renderType, layerId);
                onEntityCreating?.(options);

                return options;
            }
        }
        return null;
    }

    // For predefined types, use the registry
    const renderer = registry[type];
    const options = renderer ? renderer(item) : null;
    if (options) {
        enrichEntity(options, type, layerId);
        onEntityCreating?.(options);

        return options;
    }
    return null;
}