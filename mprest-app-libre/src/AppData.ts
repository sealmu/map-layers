import type { LayerData } from "@mprest/map-maplibre";
import { Colors } from "@mprest/map-core";

export const dataSourceDynamic: Record<string, LayerData[]> = {
  "dynamic-raw": [
    {
      id: "raw1",
      name: "Raw Point 1",
      color: Colors.RED,
      positions: [{ longitude: -75.0, latitude: 40.0 }],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw2",
      name: "Raw Point 2",
      color: Colors.BLUE,
      positions: [{ longitude: -76.0, latitude: 41.0 }],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw3",
      name: "Raw Point 3",
      color: Colors.GREEN,
      positions: [{ longitude: -74.0, latitude: 42.0 }],
      view: "default",
      renderType: "points",
    },
  ],
};

function DataUpdater(
  data: Record<string, LayerData[]>,
  interval: number = 1000,
) {
  const timerId = setInterval(() => {
    const keys = Object.keys(data);
    if (keys.length === 0) return;

    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const layerArray = data[randomKey];
    if (!layerArray || layerArray.length === 0) return;

    const randomIndex = Math.floor(Math.random() * layerArray.length);

    const randomLon = -125 + Math.random() * 59; // -125 to -66
    const randomLat = 24 + Math.random() * 25;  // 24 to 49

    layerArray[randomIndex].positions = [{ longitude: randomLon, latitude: randomLat }];
  }, interval);

  // return a way to stop it
  return () => clearInterval(timerId);
}

(function updateDataFromSocket() {
  DataUpdater(dataSourceDynamic, 500);
})();
