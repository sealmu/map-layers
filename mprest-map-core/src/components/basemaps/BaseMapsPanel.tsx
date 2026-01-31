import type { IBaseMapsPanelProps, IBaseMapConfig } from "../../types";

interface BaseMapsPanelProps extends IBaseMapsPanelProps {
  /** Custom CSS class name */
  className?: string;
  /** Position of the panel */
  position?: "top-left" | "top-center" | "top-right";
}

const DefaultLabel = ({ baseMap }: { baseMap: IBaseMapConfig }) => (
  <span
    className="basemap-label"
    style={{
      display: "inline-block",
      padding: "4px 12px",
      margin: "0 4px",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 500,
      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    }}
  >
    {baseMap.name}
  </span>
);

const BaseMapsPanel = ({
  api,
  className,
  position = "top-center",
  renderLabel,
}: BaseMapsPanelProps) => {
  const { enabledBaseMaps } = api;

  if (enabledBaseMaps.length === 0) {
    return null;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: "10px", left: "10px" },
    "top-center": { top: "10px", left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: "10px", right: "10px" },
  };

  return (
    <div
      className={`basemaps-panel ${className ?? ""}`}
      style={{
        position: "absolute",
        zIndex: 1000,
        display: "flex",
        gap: "8px",
        pointerEvents: "none",
        ...positionStyles[position],
      }}
    >
      {enabledBaseMaps.map((baseMap) => (
        <div key={baseMap.id}>
          {renderLabel ? renderLabel(baseMap) : <DefaultLabel baseMap={baseMap} />}
        </div>
      ))}
    </div>
  );
};

export default BaseMapsPanel;
