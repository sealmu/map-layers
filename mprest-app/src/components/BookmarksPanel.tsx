import { useState } from "react";
import type { BookmarksApi, LocationsApi, PlaceResult } from "@mprest/map-core";
import type { MapApi } from "@mprest/map-cesium";

interface BookmarksPanelProps {
  api: MapApi & { bookmarks?: BookmarksApi; locations?: LocationsApi };
}

export function BookmarksPanel({ api }: BookmarksPanelProps) {
  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const bookmarks = api.bookmarks?.bookmarks ?? [];

  const handleAddBookmark = () => {
    if (!newBookmarkName.trim()) return;
    api.bookmarks?.addBookmark(newBookmarkName.trim());
    setNewBookmarkName("");
  };

  const handleBookmarkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddBookmark();
    }
  };

  const handlePlaceSearch = async () => {
    if (!placeQuery.trim() || !api.locations) return;

    setIsSearching(true);
    try {
      const results = await api.locations.searchPlaces(placeQuery);
      setPlaceResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePlaceSearch();
    }
  };

  const handleGotoPlace = (place: PlaceResult) => {
    api.locations?.gotoLocation(place.coordinates, { range: 1000000 });
    setPlaceResults([]);
    setPlaceQuery("");
  };

  const handleGotoBookmark = (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;

    // Use locations API if available, otherwise fall back to bookmark's goToBookmark
    if (api.locations) {
      api.locations.gotoLocation(
        {
          longitude: bookmark.position.longitude,
          latitude: bookmark.position.latitude,
          height: bookmark.position.height ?? 10000,
        },
        {
          heading: bookmark.camera.heading,
          pitch: bookmark.camera.pitch,
        }
      );
    } else {
      api.bookmarks?.goToBookmark(bookmarkId);
    }
  };

  return (
    <div style={{ padding: "8px" }}>
      {/* Place Search Section */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#666" }}>
          Search Places
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            onKeyDown={handlePlaceKeyDown}
            placeholder="Search for a place..."
            style={{
              flex: 1,
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={handlePlaceSearch}
            disabled={!placeQuery.trim() || isSearching}
            style={{
              padding: "6px 12px",
              background: placeQuery.trim() && !isSearching ? "#4a90d9" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: placeQuery.trim() && !isSearching ? "pointer" : "not-allowed",
            }}
          >
            {isSearching ? "..." : "Go"}
          </button>
        </div>

        {placeResults.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", maxHeight: "150px", overflowY: "auto" }}>
            {placeResults.map((place, index) => (
              <li
                key={index}
                onClick={() => handleGotoPlace(place)}
                style={{
                  padding: "6px 8px",
                  marginBottom: "2px",
                  background: "#f0f7ff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={place.name}
              >
                {place.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bookmarks Section */}
      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#666" }}>
        Bookmarks
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          type="text"
          value={newBookmarkName}
          onChange={(e) => setNewBookmarkName(e.target.value)}
          onKeyDown={handleBookmarkKeyDown}
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
                onClick={() => handleGotoBookmark(bookmark.id)}
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
