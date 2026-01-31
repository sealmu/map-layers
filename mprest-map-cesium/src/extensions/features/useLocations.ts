import { useCallback, useMemo } from "react";
import { useViewer, createLogger } from "@mprest/map-core";
import type { ExtensionModule, ExtensionContext } from "../../types";

const logger = createLogger("useLocations");

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
  range: 100000,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useLocations = (_ctx: ExtensionContext): LocationsApi => {
  const { viewer } = useViewer();

  const gotoLocation = useCallback(
    (coords: Coordinates, options?: GotoOptions): boolean => {
      if (!viewer?.accessors) return false;

      const opts = { ...DEFAULT_OPTIONS, ...options };

      viewer.accessors.flyToLocation(
        {
          longitude: coords.longitude,
          latitude: coords.latitude,
          height: coords.height ?? 0,
        },
        {
          heading: opts.heading,
          pitch: opts.pitch,
          range: opts.range,
          duration: opts.duration,
        }
      );

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
        logger.error("Place search failed", error instanceof Error ? error : undefined);
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
const locationsExtension: ExtensionModule<LocationsApi> = {
  name: "locations",
  useExtension: useLocations,
  priority: 10, // Load before bookmarks so it can be used as dependency
};

// Type augmentation - makes api.locations fully typed
declare module "../../types" {
  interface MapApi {
    locations?: LocationsApi;
  }
}

export default locationsExtension;
