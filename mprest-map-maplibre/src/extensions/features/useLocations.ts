import { useCallback, useMemo } from "react";
import { useViewer } from "@mprest/map-core";
import type { ExtensionModule, ExtensionContext, ViewerWithConfigs } from "../../types";

export interface Coordinates {
  longitude: number;
  latitude: number;
  height?: number;
}

export interface GotoOptions {
  duration?: number;
  heading?: number;
  pitch?: number;
  range?: number;
  zoom?: number;
}

export interface PlaceResult {
  name: string;
  coordinates: Coordinates;
  boundingBox?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

export interface LocationsApi {
  gotoLocation: (coords: Coordinates, options?: GotoOptions) => boolean;
  gotoPlaceResult: (place: PlaceResult, options?: GotoOptions) => boolean;
  gotoPlace: (query: string, options?: GotoOptions) => Promise<PlaceResult | null>;
  searchPlaces: (query: string) => Promise<PlaceResult[]>;
}

const DEFAULT_ZOOM = 10;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useLocations = (_ctx: ExtensionContext): LocationsApi => {
  const { viewer } = useViewer();

  const gotoLocation = useCallback(
    (coords: Coordinates, options?: GotoOptions): boolean => {
      if (!viewer) return false;

      const maplibreViewer = viewer as unknown as ViewerWithConfigs;
      const map = maplibreViewer.map;
      if (!map) return false;

      map.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: options?.zoom ?? DEFAULT_ZOOM,
        bearing: options?.heading ?? 0,
        pitch: options?.pitch ?? 0,
        duration: (options?.duration ?? 1.5) * 1000,
      });

      return true;
    },
    [viewer]
  );

  const searchPlaces = useCallback(
    async (query: string): Promise<PlaceResult[]> => {
      if (!query.trim()) return [];

      try {
        // Using Nominatim OpenStreetMap geocoding API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          {
            headers: {
              "User-Agent": "MprestMap/1.0",
            },
          }
        );

        if (!response.ok) return [];

        const results = await response.json();

        return results.map((result: {
          display_name: string;
          lon: string;
          lat: string;
          boundingbox?: string[];
        }) => ({
          name: result.display_name,
          coordinates: {
            longitude: parseFloat(result.lon),
            latitude: parseFloat(result.lat),
          },
          boundingBox: result.boundingbox
            ? {
                south: parseFloat(result.boundingbox[0]),
                north: parseFloat(result.boundingbox[1]),
                west: parseFloat(result.boundingbox[2]),
                east: parseFloat(result.boundingbox[3]),
              }
            : undefined,
        }));
      } catch (error) {
        console.error("Place search failed:", error);
        return [];
      }
    },
    []
  );

  const gotoPlaceResult = useCallback(
    (place: PlaceResult, options?: GotoOptions): boolean => {
      if (!viewer) return false;

      // If place has bounding box, fit to bounds for better zoom
      if (place.boundingBox) {
        const maplibreViewer = viewer as unknown as ViewerWithConfigs;
        const map = maplibreViewer.map;
        if (map) {
          map.fitBounds(
            [
              [place.boundingBox.west, place.boundingBox.south],
              [place.boundingBox.east, place.boundingBox.north],
            ],
            {
              duration: (options?.duration ?? 1.5) * 1000,
              padding: 50,
            }
          );
          return true;
        }
      }

      // Fall back to gotoLocation with provided or default zoom
      return gotoLocation(place.coordinates, { zoom: 6, ...options });
    },
    [viewer, gotoLocation]
  );

  const gotoPlace = useCallback(
    async (query: string, options?: GotoOptions): Promise<PlaceResult | null> => {
      if (!viewer) return null;

      const results = await searchPlaces(query);
      if (results.length === 0) return null;

      const place = results[0];
      gotoPlaceResult(place, options);
      return place;
    },
    [viewer, searchPlaces, gotoPlaceResult]
  );

  return useMemo(
    () => ({
      gotoLocation,
      gotoPlaceResult,
      gotoPlace,
      searchPlaces,
    }),
    [gotoLocation, gotoPlaceResult, gotoPlace, searchPlaces]
  );
};

// Extension definition
const locationsExtension: ExtensionModule<LocationsApi> = {
  name: "locations",
  useExtension: useLocations,
  priority: 10,
};

// Type augmentation
declare module "../../types" {
  interface MapApi {
    locations?: LocationsApi;
  }
}

export default locationsExtension;
