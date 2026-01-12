import { useState } from "react";
import type { ReactNode } from "react";
import "../styles/Expander.css";

export type ExpanderPosition = "left" | "right" | "top" | "bottom";
export type ExpanderSize = "full" | "content";

interface ExpanderProps {
    children: ReactNode;
    title: string;
    position: ExpanderPosition;
    size?: ExpanderSize;
    isDocked?: boolean;
    onToggle?: (isDocked: boolean) => void;
    className?: string;
}

const Expander = ({
    children,
    title,
    position,
    size = "content",
    isDocked = false,
    onToggle,
    className = "",
}: ExpanderProps) => {
    const [internalIsDocked, setInternalIsDocked] = useState(isDocked);

    const currentIsDocked = onToggle ? isDocked : internalIsDocked;

    const handleToggle = () => {
        const newState = !currentIsDocked;
        if (onToggle) {
            onToggle(newState);
        } else {
            setInternalIsDocked(newState);
        }
    };

    const isHorizontal = position === "top" || position === "bottom";
    const isVertical = position === "left" || position === "right";

    return (
        <div
            className={`expander ${position} ${size} ${currentIsDocked ? "docked" : "expanded"} ${className}`}
        >
            <div className="expander-content">
                {children}
            </div>
            <button
                className="expander-toggle"
                onClick={handleToggle}
                aria-label={`${currentIsDocked ? "Expand" : "Collapse"} ${title}`}
            >
                <span className="expander-title">
                    {isVertical ? (
                        <span className="vertical-text">{title}</span>
                    ) : (
                        title
                    )}
                </span>
                <span className="expander-arrow">
                    {isHorizontal ? (
                        position === "top" ? (currentIsDocked ? "▼" : "▲") : currentIsDocked ? "▲" : "▼"
                    ) : position === "left" ? (
                        currentIsDocked ? "▶" : "◀"
                    ) : (
                        currentIsDocked ? "◀" : "▶"
                    )}
                </span>
            </button>
        </div>
    );
};

export default Expander;
export type { ExpanderProps };