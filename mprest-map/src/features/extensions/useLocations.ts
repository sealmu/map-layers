import { useCallback, useMemo } from "react";
import { Cartesian3 } from "cesium";
import { useViewer } from "../../hooks/useViewer";
import type { FeatureExtensionModule, FeatureContext } from "../../types";

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
  gotoPlace: (query: string, options?: GotoOptions) => Promise<PlaceResult | null>;
  searchPlaces: (query: string) => Promise<PlaceResult[]>;
}

const DEFAULT_OPTIONS: GotoOptions = {
  duration: 1.5,
  heading: 0,
  pitch: -45 * (Math.PI / 180),
  range: 10000,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useLocations = (_ctx: FeatureContext): LocationsApi => {
  const { viewer } = useViewer();

  const gotoLocation = useCallback(
    (coords: Coordinates, options?: GotoOptions): boolean => {
      if (!viewer) return false;

      const opts = { ...DEFAULT_OPTIONS, ...options };
      const height = coords.height ?? opts.range ?? 10000;

      const destination = Cartesian3.fromDegrees(
        coords.longitude,
        coords.latitude,
        height
      );

      viewer.camera.flyTo({
        destination,
        orientation: {
          heading: opts.heading ?? 0,
          pitch: opts.pitch ?? -45 * (Math.PI / 180),
          roll: 0,
        },
        duration: opts.duration ?? 1.5,
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

  const gotoPlace = useCallback(
    async (query: string, options?: GotoOptions): Promise<PlaceResult | null> => {
      const results = await searchPlaces(query);
      if (results.length === 0) return null;

      const place = results[0];
      gotoLocation(place.coordinates, options);

      return place;
    },
    [searchPlaces, gotoLocation]
  );

  return useMemo(
    () => ({
      gotoLocation,
      gotoPlace,
      searchPlaces,
    }),
    [gotoLocation, gotoPlace, searchPlaces]
  );
};

// Extension definition - this is what the extension loader discovers
const locationsExtension: FeatureExtensionModule<LocationsApi> = {
  name: "locations",
  useFeature: useLocations,
  priority: 10, // Load before bookmarks so it can be used as dependency
};

// Type augmentation - makes api.locations fully typed
declare module "../../types" {
  interface MapApi {
    locations?: LocationsApi;
  }
}

export default locationsExtension;
