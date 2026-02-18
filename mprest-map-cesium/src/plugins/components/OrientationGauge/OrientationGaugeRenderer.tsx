import { useMemo, type CSSProperties } from "react";
import type { ICameraOrientation } from "@mprest/map-core";

export interface OrientationGaugeRendererProps {
  orientation: ICameraOrientation | null;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function normalizeHeading(headingRad: number): number {
  let deg = toDeg(headingRad) % 360;
  if (deg < 0) deg += 360;
  if (deg >= 359.5) deg = 0;
  return deg;
}

const S = 130;
const C = S / 2;
const R = 42;
const COL = "#2d2d2d";
const TIP_LEN = 32;
const WAIST = 7;

const containerStyle: CSSProperties = {
  position: "absolute",
  bottom: 60,
  left: 10,
  zIndex: 1000,
  pointerEvents: "auto",
  userSelect: "none",
};

const wrapperStyle: CSSProperties = {
  width: S,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const layerContainerStyle: CSSProperties = {
  width: S,
  height: S,
  position: "relative",
  filter: "drop-shadow(0 0 3px white) drop-shadow(0 0 6px white) drop-shadow(0 0 12px white)",
};

const flatSvgStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
};

const perspectiveStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: S,
  height: S,
  perspective: "400px",
};

const ARCS = [
  { start: 15, end: 75 },
  { start: 105, end: 165 },
  { start: 195, end: 255 },
  { start: 285, end: 345 },
];

export function OrientationGaugeRenderer({
  orientation,
}: OrientationGaugeRendererProps) {
  if (!orientation) return null;

  const headingDeg = normalizeHeading(orientation.heading);
  const pitchDeg = toDeg(orientation.pitch);
  const visualTilt = pitchDeg + 90;

  const starTransform = useMemo(
    () => `rotate(${-headingDeg}deg) rotateX(${visualTilt}deg)`,
    [headingDeg, visualTilt],
  );

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <div style={layerContainerStyle}>
          {/* Layer 1: Outer ring + labels (flat, rotates with heading) */}
          <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={flatSvgStyle}>
            <g transform={`rotate(${-headingDeg} ${C} ${C})`}>
              {ARCS.map(({ start, end }) => {
                const s = ((start - 90) * Math.PI) / 180;
                const e = ((end - 90) * Math.PI) / 180;
                return (
                  <path
                    key={start}
                    d={`M ${C + R * Math.cos(s)} ${C + R * Math.sin(s)} A ${R} ${R} 0 0 1 ${C + R * Math.cos(e)} ${C + R * Math.sin(e)}`}
                    fill="none" stroke={COL} strokeWidth="2.5"
                  />
                );
              })}
              <text x={C} y={C - R} fill={COL} fontSize="14" fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle" dominantBaseline="central">N</text>
              <text x={C + R} y={C} fill={COL} fontSize="14" fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle" dominantBaseline="central">E</text>
              <text x={C} y={C + R} fill={COL} fontSize="14" fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle" dominantBaseline="central">S</text>
              <text x={C - R} y={C} fill={COL} fontSize="14" fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle" dominantBaseline="central">W</text>
            </g>
            {/* Heading readout – bottom-left */}
            <text x={C - 20} y={C + 20} fill={COL} fontSize="10" fontWeight="700"
              fontFamily="'SF Mono', 'Cascadia Code', 'Consolas', monospace"
              textAnchor="middle" dominantBaseline="central">
              {Math.round(headingDeg)}°
            </text>
            {/* Pitch readout – bottom-right */}
            <text x={C + 20} y={C + 20} fill="rgba(0,0,0,0.5)" fontSize="10" fontWeight="600"
              fontFamily="'SF Mono', 'Cascadia Code', 'Consolas', monospace"
              textAnchor="middle" dominantBaseline="central">
              {Math.abs(Math.round(pitchDeg))}°
            </text>
          </svg>

          {/* Layer 2: Windrose star (HTML div for 3D tilt) */}
          <div style={perspectiveStyle}>
            <div style={{
              width: S, height: S,
              transform: starTransform,
              transformOrigin: "center center",
            }}>
              <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
                {/* North */}
                <polygon points={`${C},${C - TIP_LEN} ${C - WAIST},${C} ${C},${C}`} fill={COL} stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                <polygon points={`${C},${C - TIP_LEN} ${C + WAIST},${C} ${C},${C}`} fill="none" stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                {/* South */}
                <polygon points={`${C},${C + TIP_LEN} ${C + WAIST},${C} ${C},${C}`} fill={COL} stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                <polygon points={`${C},${C + TIP_LEN} ${C - WAIST},${C} ${C},${C}`} fill="none" stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                {/* East */}
                <polygon points={`${C + TIP_LEN},${C} ${C},${C - WAIST} ${C},${C}`} fill={COL} stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                <polygon points={`${C + TIP_LEN},${C} ${C},${C + WAIST} ${C},${C}`} fill="none" stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                {/* West */}
                <polygon points={`${C - TIP_LEN},${C} ${C},${C + WAIST} ${C},${C}`} fill={COL} stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                <polygon points={`${C - TIP_LEN},${C} ${C},${C - WAIST} ${C},${C}`} fill="none" stroke={COL} strokeWidth="1" strokeLinejoin="round" />
                {/* Center dot */}
                <circle cx={C} cy={C} r="2.5" fill={COL} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
