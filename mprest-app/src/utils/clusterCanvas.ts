const imageCache = new Map<number, HTMLCanvasElement>();

export interface ClusterBillboardId {
  isCluster: true;
  layerId: string;
  entities: Array<{ id: string; name: string; type?: string }>;
}

/** Material color tiers based on cluster density */
function clusterColor(count: number): string {
  if (count < 10) return "#1976D2";   // Blue 700
  if (count < 50) return "#0097A7";   // Cyan 700
  if (count < 100) return "#F57C00";  // Orange 700
  return "#D32F2F";                   // Red 700
}

export function createClusterCanvas(count: number): HTMLCanvasElement {
  const cached = imageCache.get(count);
  if (cached) return cached;

  const size = count < 10 ? 48 : count < 50 ? 56 : count < 100 ? 64 : 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const color = clusterColor(count);

  // Outer ring (semi-transparent)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color + "33"; // 20% opacity
  ctx.fill();

  // Inner solid circle
  const innerR = r - 4;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Count text
  const fs = count < 10 ? 15 : count < 100 ? 13 : 11;
  ctx.font = `500 ${fs}px "Roboto", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), cx, cy);

  imageCache.set(count, canvas);
  return canvas;
}
