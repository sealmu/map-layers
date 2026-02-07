const imageCache = new Map<number, HTMLCanvasElement>();

export interface ClusterBillboardId {
  isCluster: true;
  layerId: string;
  entities: Array<{ id: string; name: string }>;
}

export function createClusterCanvas(count: number): HTMLCanvasElement {
  const cached = imageCache.get(count);
  if (cached) return cached;

  const size = count < 10 ? 44 : count < 50 ? 52 : count < 100 ? 60 : 68;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;

  // Outer glow
  ctx.shadowColor = "rgba(99, 102, 241, 0.6)";
  ctx.shadowBlur = 8;

  // Main circle — radial gradient (light indigo center → dark indigo edge)
  const grad = ctx.createRadialGradient(cx * 0.75, cy * 0.75, 0, cx, cy, r);
  grad.addColorStop(0, "#a5b4fc");
  grad.addColorStop(0.4, "#6366f1");
  grad.addColorStop(1, "#3730a3");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Glass highlight (top-left shine)
  const hl = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.3, cy + r * 0.3);
  hl.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  hl.addColorStop(0.4, "rgba(255, 255, 255, 0.05)");
  hl.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.fillStyle = hl;
  ctx.fill();

  // Thin border ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Count text with subtle drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  const fs = count < 10 ? 18 : count < 100 ? 15 : 12;
  ctx.font = `700 ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), cx, cy + 0.5);

  imageCache.set(count, canvas);
  return canvas;
}
