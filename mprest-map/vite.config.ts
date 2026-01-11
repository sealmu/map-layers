import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
const cesiumBuildRootPath = path.resolve(
  __dirname,
  "../node_modules/cesium/Build",
);
const cesiumBuildPath = path.resolve(cesiumBuildRootPath, "Cesium");

// https://vite.dev/config/
export default defineConfig({
  root: "example",
  // define: {
  //   __REACT_DEVTOOLS_GLOBAL_HOOK__: false,
  // },
  resolve: {
    alias: {
      "@mprest/map": path.resolve(__dirname, "./src/index.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  plugins: [
    react(),
    cesium({
      cesiumBuildRootPath,
      cesiumBuildPath,
    }),
  ],
});
