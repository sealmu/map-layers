// Provider-agnostic utilities
export { extractLayersFromChildren } from "./extractLayersFromChildren";
export { default as hasLayersChanged } from "./hasLayersChanged";

// Re-export Cesium-specific utilities for backwards compatibility
export { getLocationFromPosition } from "../../../providers/cesium/utils/getLocationFromPosition";
export { handleMapClick, type HandleMapClickOptions } from "../../../providers/cesium/utils/handleMapClick";
