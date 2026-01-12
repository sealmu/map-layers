import { useState } from "react";
import Expander from "./Expander";

const ExpanderDemo = () => {
    const [bottomDocked, setBottomDocked] = useState(true);
    const [rightTopDocked, setRightTopDocked] = useState(false);
    const [rightBottomDocked, setRightBottomDocked] = useState(true);

    const demoContent = (title: string, bgColor: string) => (
        <div style={{
            padding: "20px",
            backgroundColor: bgColor,
            color: "white",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold"
        }}>
            {title} Content
        </div>
    );

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#f0f0f0" }}>
            {/* Bottom Layers Panel */}
            <Expander
                title="Layers"
                position="bottom"
                size="full"
                isDocked={bottomDocked}
                onToggle={setBottomDocked}
                className="bottom-layers"
            >
                {demoContent("Layers Panel", "#4CAF50")}
            </Expander>

            {/* Right Side Panels */}
            <div style={{
                position: "absolute",
                top: "50px",
                right: "0",
                width: "300px",
                height: "calc(100vh - 100px)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
            }}>
                <Expander
                    title="Filters"
                    position="right"
                    size="content"
                    isDocked={rightTopDocked}
                    onToggle={setRightTopDocked}
                >
                    {demoContent("Filters Panel", "#2196F3")}
                </Expander>

                <Expander
                    title="Search"
                    position="right"
                    size="content"
                    isDocked={rightBottomDocked}
                    onToggle={setRightBottomDocked}
                >
                    {demoContent("Search Panel", "#FF9800")}
                </Expander>
            </div>

            {/* Demo Controls */}
            <div style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                fontSize: "14px"
            }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Expander Demo</h3>
                <p style={{ margin: "0", color: "#666" }}>
                    Click the toggle buttons to expand/collapse panels.<br />
                    Try different positions and sizes!
                </p>
            </div>
        </div>
    );
};

export default ExpanderDemo;