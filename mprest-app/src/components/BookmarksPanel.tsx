import { useState } from "react";
import type { MapApi, BookmarksApi } from "@mprest/map";

interface BookmarksPanelProps {
  api: MapApi & { bookmarks?: BookmarksApi };
}

export function BookmarksPanel({ api }: BookmarksPanelProps) {
  const [newBookmarkName, setNewBookmarkName] = useState("");

  const bookmarks = api.bookmarks?.bookmarks ?? [];

  const handleAddBookmark = () => {
    if (!newBookmarkName.trim()) return;
    api.bookmarks?.addBookmark(newBookmarkName.trim());
    setNewBookmarkName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddBookmark();
    }
  };

  return (
    <div style={{ padding: "8px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          type="text"
          value={newBookmarkName}
          onChange={(e) => setNewBookmarkName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bookmark name..."
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleAddBookmark}
          disabled={!newBookmarkName.trim()}
          style={{
            padding: "6px 12px",
            background: newBookmarkName.trim() ? "#4a90d9" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: newBookmarkName.trim() ? "pointer" : "not-allowed",
          }}
        >
          Save
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div style={{ color: "#888", fontSize: "13px" }}>
          No bookmarks yet. Navigate to a location and save it.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px",
                marginBottom: "4px",
                background: "#f5f5f5",
                borderRadius: "4px",
              }}
            >
              <span
                style={{ cursor: "pointer", flex: 1 }}
                onClick={() => api.bookmarks?.goToBookmark(bookmark.id)}
                title="Click to fly to this location"
              >
                {bookmark.name}
              </span>
              <button
                onClick={() => api.bookmarks?.removeBookmark(bookmark.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
                title="Remove bookmark"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {bookmarks.length > 0 && (
        <button
          onClick={() => api.bookmarks?.clearBookmarks()}
          style={{
            marginTop: "12px",
            padding: "4px 8px",
            background: "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            color: "#666",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
