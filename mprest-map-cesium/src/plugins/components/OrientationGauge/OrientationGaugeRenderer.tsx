import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { ICameraOrientation } from "@mprest/map-core";

export interface OrientationGaugeRendererProps {
  orientation: ICameraOrientation | null;
}

// ============================================
// Helpers
// ============================================

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function formatDeg(rad: number): string {
  return `${Math.round(toDeg(rad))}`;
}

function normalizeHeading(headingRad: number): number {
  let deg = toDeg(headingRad) % 360;
  if (deg < 0) deg += 360;
  if (deg >= 359.5) deg = 0; // avoid 360 display jump
  return deg;
}

// ============================================
// Constants
// ============================================

const SIZE = 120;
const CENTER = SIZE / 2;
const OUTER_R = 54;
const INNER_R = 42;
const TICK_R_MAJOR = 54;
const TICK_R_MINOR = 50;
const TICK_INNER_MAJOR = 44;
const TICK_INNER_MINOR = 46;
const CARDINAL_R = 36;

const ACCENT = "#d93025";
const DIM = "rgba(0,0,0,0.3)";
const DARK = "rgba(0,0,0,0.8)";
const SUBTLE = "rgba(0,0,0,0.12)";

// ============================================
// SVG Generators
// ============================================

function generateTicks(): ReactNode[] {
  const ticks: ReactNode[] = [];

  for (let deg = 0; deg < 360; deg += 5) {
    const isMajor = deg % 30 === 0;
    const isCardinal = deg % 90 === 0;
    const rad = (deg * Math.PI) / 180;

    const outerR = isMajor ? TICK_R_MAJOR : TICK_R_MINOR;
    const innerR = isMajor ? TICK_INNER_MAJOR : TICK_INNER_MINOR;

    const x1 = CENTER + innerR * Math.sin(rad);
    const y1 = CENTER - innerR * Math.cos(rad);
    const x2 = CENTER + outerR * Math.sin(rad);
    const y2 = CENTER - outerR * Math.cos(rad);

    ticks.push(
      <line
        key={`tick-${deg}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isCardinal ? DARK : isMajor ? DIM : SUBTLE}
        strokeWidth={isCardinal ? 2 : isMajor ? 1.2 : 0.6}
        strokeLinecap="round"
      />,
    );
  }

  return ticks;
}

interface CardinalLabel {
  deg: number;
  label: string;
  color: string;
}

const CARDINALS: CardinalLabel[] = [
  { deg: 0, label: "N", color: ACCENT },
  { deg: 90, label: "E", color: DARK },
  { deg: 180, label: "S", color: DARK },
  { deg: 270, label: "W", color: DARK },
];

function generateCardinals(): ReactNode[] {
  return CARDINALS.map(({ deg, label, color }) => {
    const rad = (deg * Math.PI) / 180;
    const x = CENTER + CARDINAL_R * Math.sin(rad);
    const y = CENTER - CARDINAL_R * Math.cos(rad);

    return (
      <text
        key={`card-${deg}`}
        x={x}
        y={y}
        fill={color}
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </text>
    );
  });
}

function generateNorthTriangle(): ReactNode {
  const tipY = CENTER - OUTER_R - 4;
  const baseY = CENTER - OUTER_R + 2;
  const halfW = 4;

  return (
    <polygon
      points={`${CENTER},${tipY} ${CENTER - halfW},${baseY} ${CENTER + halfW},${baseY}`}
      fill={ACCENT}
      opacity="0.9"
    />
  );
}

// ============================================
// Pitch Arc
// ============================================

function generatePitchArc(pitchRad: number): ReactNode | null {
  const pitchDeg = toDeg(pitchRad);
  const clampedPitch = Math.max(-90, Math.min(90, pitchDeg));
  const normalized = clampedPitch / 90; // -1 to 1

  if (Math.abs(normalized) < 0.01) return null;

  const arcR = 18;
  const startAngle = -Math.PI / 2;
  const sweepAngle = normalized * (Math.PI / 2);
  const endAngle = startAngle + sweepAngle;

  const x1 = CENTER + arcR * Math.cos(startAngle);
  const y1 = CENTER + arcR * Math.sin(startAngle);
  const x2 = CENTER + arcR * Math.cos(endAngle);
  const y2 = CENTER + arcR * Math.sin(endAngle);

  const largeArc = Math.abs(sweepAngle) > Math.PI ? 1 : 0;
  const sweep = sweepAngle > 0 ? 1 : 0;

  return (
    <path
      d={`M ${x1} ${y1} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${x2} ${y2}`}
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  );
}

// ============================================
// Component
// ============================================

const containerStyle: CSSProperties = {
  position: "absolute",
  bottom: 60,
  left: 10,
  zIndex: 1000,
  pointerEvents: "auto",
  userSelect: "none",
};

const wrapperStyle: CSSProperties = {
  width: SIZE,
  height: SIZE + 42,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
};

const svgContainerStyle: CSSProperties = {
  width: SIZE,
  height: SIZE,
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 4px 20px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.06)",
  overflow: "visible",
};

const readoutContainerStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 6,
  padding: "4px 10px",
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.06)",
};

const readoutItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: 28,
};

const readoutLabelStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 600,
  color: "rgba(0,0,0,0.4)",
  fontFamily: "system-ui, -apple-system, sans-serif",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  lineHeight: 1,
};

const readoutValueStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(0,0,0,0.8)",
  fontFamily: "'SF Mono', 'Cascadia Code', 'Consolas', monospace",
  lineHeight: 1.3,
};

// Pre-generate static elements
const TICKS = generateTicks();
const CARDINALS_EL = generateCardinals();
const NORTH_TRI = generateNorthTriangle();

export function OrientationGaugeRenderer({
  orientation,
}: OrientationGaugeRendererProps) {
  if (!orientation) return null;

  const headingDeg = normalizeHeading(orientation.heading);
  const rollDeg = normalizeHeading(orientation.roll);

  const compassRotation = useMemo(
    () => `rotate(${-headingDeg} ${CENTER} ${CENTER})`,
    [headingDeg],
  );

  const pitchArc = useMemo(
    () => generatePitchArc(orientation.pitch),
    [orientation.pitch],
  );

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Compass Rose */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={svgContainerStyle}
        >
          {/* Outer ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_R}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R}
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="0.5"
          />

          {/* Rotating group (follows heading) */}
          <g transform={compassRotation}>
            {TICKS}
            {CARDINALS_EL}
            {NORTH_TRI}
          </g>

          {/* Fixed center - heading pointer */}
          <line
            x1={CENTER}
            y1={CENTER - 20}
            x2={CENTER}
            y2={CENTER - INNER_R + 2}
            stroke={DARK}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Center dot */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r="2.5"
            fill={DARK}
            opacity="0.5"
          />

          {/* Pitch arc indicator */}
          {pitchArc}

          {/* Heading degree in center */}
          <text
            x={CENTER}
            y={CENTER + 8}
            fill={DARK}
            fontSize="14"
            fontWeight="800"
            fontFamily="'SF Mono', 'Cascadia Code', 'Consolas', monospace"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {Math.round(headingDeg)}°
          </text>
        </svg>

        {/* Digital readout */}
        <div style={readoutContainerStyle}>
          <div style={readoutItemStyle}>
            <span style={readoutLabelStyle}>Heading</span>
            <span style={readoutValueStyle}>{Math.round(headingDeg)}°</span>
          </div>
          <div
            style={{
              width: 1,
              background: "rgba(0,0,0,0.08)",
              alignSelf: "stretch",
              margin: "2px 0",
            }}
          />
          <div style={readoutItemStyle}>
            <span style={readoutLabelStyle}>Pitch</span>
            <span style={readoutValueStyle}>{formatDeg(orientation.pitch)}°</span>
          </div>
          <div
            style={{
              width: 1,
              background: "rgba(0,0,0,0.08)",
              alignSelf: "stretch",
              margin: "2px 0",
            }}
          />
          <div style={readoutItemStyle}>
            <span style={readoutLabelStyle}>Roll</span>
            <span style={readoutValueStyle}>{Math.round(rollDeg)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
