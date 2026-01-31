/**
 * Auto-registration module for Cesium provider.
 * Importing this module (or the main index) registers Cesium components with the core registry.
 */
import { registerMapComponent } from "@mprest/map-core";
import CesiumMap from "./CesiumMap";

// Register CesiumMap as the "cesium" provider
// eslint-disable-next-line @typescript-eslint/no-explicit-any
registerMapComponent("cesium", CesiumMap as any);

// Note: CesiumDataSourceLayer is not registered here because it has
// provider-specific props (viewer, customRenderer callbacks with Cesium types).
// Use CesiumDataSourceLayer directly or through CesiumMap's Layer children.

export const PROVIDER_TYPE = "cesium" as const;
