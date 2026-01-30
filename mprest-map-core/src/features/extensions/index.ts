import type { FeatureExtensionModule } from "../../types";

// Auto-discover all feature plugins from this folder
// Files must export a default FeatureExtensionModule
const pluginModules = import.meta.glob<{ default: FeatureExtensionModule }>(
  ["./*.ts", "!./index.ts"],
  { eager: true }
);

// Extract and sort plugins by priority (higher first), then by dependencies
const loadedPlugins: FeatureExtensionModule[] = Object.values(pluginModules)
  .map((mod) => mod.default)
  .filter(Boolean)
  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

// Topological sort to respect dependencies
function sortByDependencies(
  plugins: FeatureExtensionModule[]
): FeatureExtensionModule[] {
  const sorted: FeatureExtensionModule[] = [];
  const visited = new Set<string>();
  const pluginMap = new Map(plugins.map((p) => [p.name, p]));

  function visit(plugin: FeatureExtensionModule) {
    if (visited.has(plugin.name)) return;
    visited.add(plugin.name);

    // Visit dependencies first
    for (const dep of plugin.dependencies ?? []) {
      const depPlugin = pluginMap.get(dep);
      if (depPlugin) {
        visit(depPlugin);
      }
    }

    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    visit(plugin);
  }

  return sorted;
}

export const featureExtensions = sortByDependencies(loadedPlugins);

// Type helper: extracts the API type from an extension module
export type ExtensionApi<T extends FeatureExtensionModule> = T extends FeatureExtensionModule<infer A> ? A : never;
