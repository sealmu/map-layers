import { useState, useCallback, useMemo } from "react";
import { useViewer } from "../../hooks/useViewer";
import { toCartesian3 } from "../../providers/cesium/adapters";
import type { FeatureExtensionModule, FeatureContext } from "../../types";

export interface Bookmark {
  id: string;
  name: string;
  position: {
    longitude: number;
    latitude: number;
    height: number;
  };
  camera: {
    heading: number;
    pitch: number;
    range: number;
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

  const addBookmark = useCallback(
    (name: string): Bookmark | null => {
      if (!viewer) return null;

      const camera = viewer.camera;
      const position = camera.positionCartographic;

      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        name,
        position: {
          longitude: position.longitude * (180 / Math.PI),
          latitude: position.latitude * (180 / Math.PI),
          height: position.height,
        },
        camera: {
          heading: camera.heading,
          pitch: camera.pitch,
          range: position.height,
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
    [viewer]
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

      const destination = toCartesian3({
        longitude: bookmark.position.longitude,
        latitude: bookmark.position.latitude,
        height: bookmark.camera.range,
      });

      viewer.camera.flyTo({
        destination,
        orientation: {
          heading: bookmark.camera.heading,
          pitch: bookmark.camera.pitch,
          roll: 0,
        },
        duration: 1.5,
      });

      return true;
    },
    [viewer, bookmarks]
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
    [bookmarks, addBookmark, removeBookmark, goToBookmark, renameBookmark, clearBookmarks]
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
