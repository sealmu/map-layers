import { useState, useCallback, useMemo } from "react";
import { useViewer } from "../../hooks/useViewer";
import type { FeatureExtensionModule, FeatureContext, ICoordinate, IMapCamera, IViewerWithConfigs } from "../../types";

export interface Bookmark {
  id: string;
  name: string;
  position: ICoordinate;
  camera: {
    heading: number;
    pitch: number;
    roll: number;
  };
  zoom?: number; // Optional: for providers that use zoom instead of altitude
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

export interface BookmarksConfig {
  /** Storage key for localStorage */
  storageKey?: string;
  /** Get current zoom level (for 2D map providers) */
  getZoom?: (viewer: IViewerWithConfigs) => number | undefined;
  /** Fly to bookmark with zoom (for 2D map providers) */
  flyToWithZoom?: (viewer: IViewerWithConfigs, bookmark: Bookmark) => boolean;
}

const DEFAULT_STORAGE_KEY = "map-bookmarks";

const loadBookmarks = (storageKey: string): Bookmark[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveBookmarks = (storageKey: string, bookmarks: Bookmark[]) => {
  localStorage.setItem(storageKey, JSON.stringify(bookmarks));
};

/**
 * Create a bookmarks hook with provider-specific configuration
 */
export const createUseBookmarks = (config: BookmarksConfig = {}) => {
  const storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_ctx: FeatureContext): BookmarksApi => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { viewer } = useViewer();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks(storageKey));

    // Get camera interface
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const getCamera = useCallback((): IMapCamera | null => {
      if (!viewer) return null;
      if (viewer.accessors && "camera" in viewer.accessors) {
        return (viewer.accessors as { camera: IMapCamera }).camera;
      }
      return null;
    }, [viewer]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const addBookmark = useCallback(
      (name: string): Bookmark | null => {
        const camera = getCamera();
        if (!camera || !viewer) return null;

        const position = camera.getPosition();
        const orientation = camera.getOrientation();

        // Get zoom if provider supports it
        const zoom = config.getZoom?.(viewer);

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
          saveBookmarks(storageKey, updated);
          return updated;
        });

        return bookmark;
      },
      [getCamera, viewer],
    );

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const removeBookmark = useCallback((id: string) => {
      setBookmarks((prev) => {
        const updated = prev.filter((b) => b.id !== id);
        saveBookmarks(storageKey, updated);
        return updated;
      });
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const goToBookmark = useCallback(
      (id: string): boolean => {
        if (!viewer) return false;

        const bookmark = bookmarks.find((b) => b.id === id);
        if (!bookmark) return false;

        // Use provider-specific flyTo if available
        if (config.flyToWithZoom) {
          return config.flyToWithZoom(viewer, bookmark);
        }

        // Fall back to camera.flyTo
        const camera = getCamera();
        if (!camera) return false;

        camera.flyTo(
          {
            position: bookmark.position,
            orientation: bookmark.camera,
          },
          { duration: 1.5 },
        );

        return true;
      },
      [viewer, bookmarks, getCamera],
    );

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const renameBookmark = useCallback((id: string, name: string) => {
      setBookmarks((prev) => {
        const updated = prev.map((b) => (b.id === id ? { ...b, name } : b));
        saveBookmarks(storageKey, updated);
        return updated;
      });
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clearBookmarks = useCallback(() => {
      setBookmarks([]);
      saveBookmarks(storageKey, []);
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      () => ({
        bookmarks,
        addBookmark,
        removeBookmark,
        goToBookmark,
        renameBookmark,
        clearBookmarks,
      }),
      [bookmarks, addBookmark, removeBookmark, goToBookmark, renameBookmark, clearBookmarks],
    );
  };
};

/**
 * Create a bookmarks extension with provider-specific configuration
 */
export const createBookmarksExtension = (config: BookmarksConfig = {}): FeatureExtensionModule<BookmarksApi> => ({
  name: "bookmarks",
  useFeature: createUseBookmarks(config),
  priority: 0,
});

// Default extension (for backward compatibility)
const bookmarksExtension = createBookmarksExtension();

// Type augmentation
declare module "../../types" {
  interface MapApi {
    bookmarks?: BookmarksApi;
  }
}

export default bookmarksExtension;
