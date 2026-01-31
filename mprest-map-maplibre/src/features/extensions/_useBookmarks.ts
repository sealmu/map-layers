/**
 * REFERENCE FILE - Original MapLibre bookmarks implementation
 * Kept for reference. Active implementation uses core factory in useFeatures.ts.
 */
import { useState, useCallback, useMemo } from "react";
import { useViewer } from "@mprest/map-core";
import type { ICoordinate, IMapCamera } from "@mprest/map-core";
import type { FeatureExtensionModule, FeatureContext, ViewerWithConfigs } from "../../types";

export interface Bookmark {
  id: string;
  name: string;
  position: ICoordinate;
  camera: {
    heading: number;
    pitch: number;
    roll: number;
  };
  zoom?: number; // MapLibre-specific: store zoom directly
  createdAt: number;
}

export interface BookmarksApi {
  bookmarks: Bookmark[];
  addBookmark: (name: string) => Bookmark | null;
  removeBookmark: (id: string) => void;
  goToBookmark: (id: string) => boolean;
  renameBookmark: (id: string, name: string) => void;
  clearBookmarks: () => void;
}

const STORAGE_KEY = "maplibre-bookmarks";

const loadBookmarks = (): Bookmark[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useBookmarks = (_ctx: FeatureContext): BookmarksApi => {
  const { viewer } = useViewer();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);

  // Get camera interface - use accessors.camera if available
  const getCamera = useCallback((): IMapCamera | null => {
    if (!viewer) return null;
    // Use accessors.camera if available (provider-agnostic)
    if (viewer.accessors && "camera" in viewer.accessors) {
      return (viewer.accessors as { camera: IMapCamera }).camera;
    }
    return null;
  }, [viewer]);

  const addBookmark = useCallback(
    (name: string): Bookmark | null => {
      const camera = getCamera();
      if (!camera || !viewer) return null;

      const position = camera.getPosition();
      const orientation = camera.getOrientation();

      // Get zoom directly from MapLibre map
      const maplibreViewer = viewer as unknown as ViewerWithConfigs;
      const zoom = maplibreViewer.map?.getZoom();

      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        name,
        position: {
          longitude: position.longitude,
          latitude: position.latitude,
          height: position.height,
        },
        camera: {
          heading: orientation.heading,
          pitch: orientation.pitch,
          roll: orientation.roll,
        },
        zoom,
        createdAt: Date.now(),
      };

      setBookmarks((prev) => {
        const updated = [...prev, bookmark];
        saveBookmarks(updated);
        return updated;
      });

      return bookmark;
    },
    [getCamera, viewer],
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveBookmarks(updated);
      return updated;
    });
  }, []);

  const goToBookmark = useCallback(
    (id: string): boolean => {
      if (!viewer) return false;

      const bookmark = bookmarks.find((b) => b.id === id);
      if (!bookmark) return false;

      // Use MapLibre map directly for precise zoom control
      const maplibreViewer = viewer as unknown as ViewerWithConfigs;
      const map = maplibreViewer.map;
      if (!map) return false;

      map.flyTo({
        center: [bookmark.position.longitude, bookmark.position.latitude],
        zoom: bookmark.zoom ?? map.getZoom(),
        bearing: (bookmark.camera.heading * 180) / Math.PI,
        pitch: (bookmark.camera.pitch * 180) / Math.PI,
        duration: 1500,
      });

      return true;
    },
    [viewer, bookmarks],
  );

  const renameBookmark = useCallback((id: string, name: string) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, name } : b));
      saveBookmarks(updated);
      return updated;
    });
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    saveBookmarks([]);
  }, []);

  return useMemo(
    () => ({
      bookmarks,
      addBookmark,
      removeBookmark,
      goToBookmark,
      renameBookmark,
      clearBookmarks,
    }),
    [
      bookmarks,
      addBookmark,
      removeBookmark,
      goToBookmark,
      renameBookmark,
      clearBookmarks,
    ],
  );
};

// Extension definition
const bookmarksExtension: FeatureExtensionModule<BookmarksApi> = {
  name: "bookmarks",
  useFeature: useBookmarks,
  priority: 0,
};

// Type augmentation
// declare module "../../types" {
//   interface MapApi {
//     bookmarks?: BookmarksApi;
//   }
// }

export default bookmarksExtension;
