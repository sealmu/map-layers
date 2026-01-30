/**
 * Auto-registration module for MapLibre provider.
 * Importing this module (or the main index) registers MapLibre components with the core registry.
 */
import { registerMapComponent } from "@mprest/map-core";
import MapLibreMap from "./components/MapLibreMap";

// Register MapLibreMap as the "maplibre" provider
// eslint-disable-next-line @typescript-eslint/no-explicit-any
registerMapComponent("maplibre", MapLibreMap as any);

export const PROVIDER_TYPE = "maplibre" as const;
