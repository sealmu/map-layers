import { useState, useCallback, useMemo } from "react";
import { useViewer } from "../../hooks/useViewer";
import type { FeatureExtensionModule, FeatureContext, ICoordinate, IMapCamera } from "../../types";

export interface Bookmark {
  id: string;
  name: string;
  position: ICoordinate;
  camera: {
    heading: number;
    pitch: number;
    roll: number;
  };
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

const STORAGE_KEY = "map-bookmarks";

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

  // Get camera interface - prefer accessors.camera if available
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
      if (!camera) return null;

      const position = camera.getPosition();
      const orientation = camera.getOrientation();

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
        createdAt: Date.now(),
      };

      setBookmarks((prev) => {
        const updated = [...prev, bookmark];
        saveBookmarks(updated);
        return updated;
      });

      return bookmark;
    },
    [getCamera],
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
      const camera = getCamera();
      if (!camera) return false;

      const bookmark = bookmarks.find((b) => b.id === id);
      if (!bookmark) return false;

      // Use provider-agnostic flyTo
      camera.flyTo(
        {
          position: bookmark.position,
          orientation: bookmark.camera,
        },
        { duration: 1.5 },
      );

      return true;
    },
    [getCamera, bookmarks],
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
    [bookmarks, addBookmark, removeBookmark, goToBookmark, renameBookmark, clearBookmarks],
  );
};

// Extension definition - this is what the extension loader discovers
const bookmarksExtension: FeatureExtensionModule<BookmarksApi> = {
  name: "bookmarks",
  useFeature: useBookmarks,
  priority: 0, // default priority
};

// Type augmentation - makes api.bookmarks fully typed
declare module "../../types" {
  interface MapApi {
    bookmarks?: BookmarksApi;
  }
}

export default bookmarksExtension;
