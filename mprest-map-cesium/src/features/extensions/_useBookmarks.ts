/**
 * Cesium bookmarks extension - uses core implementation
 * Cesium uses altitude-based camera, so no special config needed
 */
import { createBookmarksExtension } from "@mprest/map-core";

// Re-export types for convenience
export type { Bookmark, BookmarksApi } from "@mprest/map-core";

// Create Cesium-specific bookmarks extension
// Default behavior works for Cesium (uses camera.flyTo with altitude)
const bookmarksExtension = createBookmarksExtension({
  storageKey: "cesium-bookmarks",
});

// Type augmentation for Cesium's MapApi
declare module "../../types" {
  interface MapApi {
    bookmarks?: import("@mprest/map-core").BookmarksApi;
  }
}

export default bookmarksExtension;
