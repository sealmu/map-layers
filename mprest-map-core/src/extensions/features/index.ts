import type { ExtensionModule } from "../../types";

// Auto-discover all feature modules from this folder
// Files must export a default ExtensionModule
const modules = import.meta.glob<{ default: ExtensionModule }>(
  ["./*.ts", "!./index.ts"],
  { eager: true }
);

// Extract and sort modules by priority (higher first), then by dependencies
const loadedModules: ExtensionModule[] = Object.values(modules)
  .map((mod) => mod.default)
  .filter(Boolean)
  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

// Topological sort to respect dependencies
function sortByDependencies(
  features: ExtensionModule[]
): ExtensionModule[] {
  const sorted: ExtensionModule[] = [];
  const visited = new Set<string>();
  const featureMap = new Map(features.map((f) => [f.name, f]));

  function visit(feature: ExtensionModule) {
    if (visited.has(feature.name)) return;
    visited.add(feature.name);

    // Visit dependencies first
    for (const dep of feature.dependencies ?? []) {
      const depFeature = featureMap.get(dep);
      if (depFeature) {
        visit(depFeature);
      }
    }

    sorted.push(feature);
  }

  for (const feature of features) {
    visit(feature);
  }

  return sorted;
}

export const featureModules = sortByDependencies(loadedModules);

// Type helper: extracts the API type from an extension module
export type FeatureApi<T extends ExtensionModule> = T extends ExtensionModule<infer A> ? A : never;
