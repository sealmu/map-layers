import { Color, Cartesian3 } from "cesium";
import type { LayerData } from "@mprest/map";

export const dataSourceDynamic = {
  "dynamic-raw": [
    {
      id: "raw1",
      name: "Raw Point 1",
      color: Color.RED,
      positions: [Cartesian3.fromDegrees(-75.0, 40.0, 100.0)],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw2",
      name: "Raw Point 2",
      color: Color.BLUE,
      positions: [Cartesian3.fromDegrees(-76.0, 41.0, 100.0)],
      view: "default",
      renderType: "points",
    },
    {
      id: "raw3",
      name: "Raw Point 3",
      color: Color.GREEN,
      positions: [Cartesian3.fromDegrees(-74.0, 42.0, 100.0)],
      view: "default",
      renderType: "points",
    },
  ] as LayerData[],
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

    const randomLon = -125 + Math.random() * 59; // -125 → -66
    const randomLat = 24 + Math.random() * 25;  // 24 → 49

    layerArray[randomIndex].positions = [
      Cartesian3.fromDegrees(randomLon, randomLat, 100.0),
    ];
  }, interval);

  // return a way to stop it
  return () => clearInterval(timerId);
}

(function updateDataFromSocket() {
  DataUpdater(dataSourceDynamic, 500);
})();