const imageCache = new Map<string, HTMLCanvasElement>();

/** Material color tiers based on cluster density */
function clusterColor(count: number): string {
  if (count < 10) return "#1976D2";   // Blue 700
  if (count < 50) return "#0097A7";   // Cyan 700
  if (count < 100) return "#F57C00";  // Orange 700
  return "#D32F2F";                   // Red 700
}

export function createClusterCanvas(count: number, hasSelection = false): HTMLCanvasElement {
  const key = `${count}:${hasSelection ? 1 : 0}`;
  const cached = imageCache.get(key);
  if (cached) return cached;

  const baseSize = count < 10 ? 48 : count < 50 ? 56 : count < 100 ? 64 : 72;
  const selectionPad = hasSelection ? 6 : 0;
  const size = baseSize + selectionPad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const cy = size / 2;

  // Selection ring (dashed green circle)
  if (hasSelection) {
    const selR = size / 2 - 1;
    ctx.beginPath();
    ctx.arc(cx, cy, selR, 0, Math.PI * 2);
    ctx.strokeStyle = "#43A047";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const r = baseSize / 2 - 2;
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

  imageCache.set(key, canvas);
  return canvas;
}
