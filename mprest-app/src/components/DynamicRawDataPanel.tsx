import { useState, useEffect, useRef } from "react";
import { useMemo } from "react";
import {
  Cartesian3,
  Color,
  Math as CesiumMath,
  JulianDate,
  ConstantProperty,
  ConstantPositionProperty,
  Cartesian2,
  LabelGraphics,
  type Entity,
} from "cesium";
import { useViewer } from "@mprest/map-core";
import { DataManager, type ViewerWithConfigs } from "@mprest/map-cesium";

const DynamicRawDataPanel = () => {
  const { viewer: coreViewer } = useViewer();
  // Cast to Cesium-specific viewer type
  const viewer = coreViewer as unknown as ViewerWithConfigs | null;
  const dataManager = useMemo(
    () => (viewer ? new DataManager(viewer) : null),
    [viewer],
  );
  const [objectCount, setObjectCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentType, setCurrentType] = useState<"points" | "rockets">(
    "points",
  );
  const animationIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Check if there are entities in the dynamic layer
  const hasDynamicEntities = () => {
    if (!dataManager) return false;
    try {
      const entities = dataManager.getLayerItems("dynamic-raw");
      return entities && entities.length > 0;
    } catch {
      return false;
    }
  };

  // Start/stop animation
  const toggleAnimation = () => {
    if (isAnimating) {
      stopAnimation();
    } else {
      startAnimation();
    }
  };

  const startAnimation = () => {
    if (!viewer || !dataManager || !hasDynamicEntities()) return;

    setIsAnimating(true);
    isAnimatingRef.current = true;
    const startTime = performance.now();

    const animate = (time: number) => {
      if (!isAnimatingRef.current) return;

      const entities = dataManager.getLayerItems("dynamic-raw");
      const elapsed = time - startTime;

      if (!entities) return;

      entities.forEach((mapEntity) => {
        const entity = mapEntity.getNativeEntity<Entity>();
        if (!entity.position && !entity.polygon) return;

        // Get original position for this entity (stored in a custom property or calculate from ID)
        const entityId = mapEntity.id;
        const isPoint = entityId.includes("point");
        const isRocket = entityId.includes("rocket");

        if (!isPoint && !isRocket) return;

        const match = isPoint
          ? entityId.match(/dynamic-raw-point-(\d+)/)
          : entityId.match(/dynamic-raw-rocket-(\d+)/);

        if (!match) return;

        const entityIndex = parseInt(match[1]);
        // Create circular motion with different phases for each entity
        const radius = 1.0; // Much bigger radius in degrees (~100km)
        const speed = 0.005; // Increased speed factor (5x faster)
        const phase = (entityIndex * Math.PI) / 4; // Different phase for each entity

        const angle = elapsed * speed + phase;
        const offsetLon = radius * Math.cos(angle);
        const offsetLat = radius * Math.sin(angle);

        if (isPoint && entity.position) {
          // Animate point
          const julianDate = JulianDate.fromDate(new Date(time));
          const currentPos = entity.position.getValue(julianDate);
          if (currentPos) {
            const cartographic =
              viewer.scene.globe.ellipsoid.cartesianToCartographic(currentPos);
            if (cartographic) {
              const newLon =
                CesiumMath.toDegrees(cartographic.longitude) + offsetLon;
              const newLat =
                CesiumMath.toDegrees(cartographic.latitude) + offsetLat;
              const newAlt = cartographic.height;

              entity.position = new ConstantPositionProperty(
                Cartesian3.fromDegrees(newLon, newLat, newAlt)
              );
            }
          }
        } else if (isRocket) {
          // Animate rocket with dynamic flight pattern
          if (entity.position) {
            const julianDate = JulianDate.fromDate(new Date(time));
            const currentPos = entity.position.getValue(julianDate);
            if (currentPos) {
              const cartographic =
                viewer.scene.globe.ellipsoid.cartesianToCartographic(
                  currentPos,
                );
              if (cartographic) {
                // Rockets have extremely slow, majestic movement with altitude changes
                const rocketSpeed = 0.0005; // Extremely slow for epic flight
                const altOscillation = 0.002; // Altitude oscillation
                const erraticFactor = 0.3; // Add some randomness to flight path

                const erraticAngle = elapsed * 0.01 + entityIndex; // Different phase for each rocket
                const rocketAngle =
                  elapsed * rocketSpeed +
                  phase +
                  Math.sin(erraticAngle) * erraticFactor;
                const rocketOffsetLon = radius * Math.cos(rocketAngle);
                const rocketOffsetLat = radius * Math.sin(rocketAngle);

                // Rockets climb and dive more dramatically
                const altChange =
                  100 *
                  Math.sin(
                    elapsed * altOscillation + (entityIndex * Math.PI) / 2,
                  );
                const newAlt = Math.max(50, cartographic.height + altChange); // Minimum altitude of 50m

                const newLon =
                  CesiumMath.toDegrees(cartographic.longitude) +
                  rocketOffsetLon;
                const newLat =
                  CesiumMath.toDegrees(cartographic.latitude) + rocketOffsetLat;

                entity.position = new ConstantPositionProperty(
                  Cartesian3.fromDegrees(newLon, newLat, newAlt)
                );
              }
            }
          }
        }
      });

      if (isAnimatingRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    isAnimatingRef.current = false;
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsAnimating(false);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  const addDynamicObject = () => {
    if (!viewer || !dataManager) return;

    setObjectCount((prev) => prev + 1);

    // Generate random position within USA territory
    const usaBounds = {
      west: -125.0, // Westernmost point (Alaska)
      east: -67.0, // Easternmost point (Maine)
      south: 24.0, // Southernmost point (Florida)
      north: 49.0, // Northernmost point (Washington state)
    };

    const lon =
      usaBounds.west + Math.random() * (usaBounds.east - usaBounds.west);
    const lat =
      usaBounds.south + Math.random() * (usaBounds.north - usaBounds.south);
    const alt = 0; // Ground level

    // Bold solid colors for objects
    const boldColors = [
      Color.RED,
      Color.BLUE,
      Color.GREEN,
      Color.YELLOW,
      Color.CYAN,
      Color.MAGENTA,
      Color.ORANGE,
      Color.PURPLE,
      Color.LIME,
      Color.PINK,
    ];

    const color = boldColors[Math.floor(Math.random() * boldColors.length)];

    let layerData;

    if (currentType === "points") {
      // Create point data
      layerData = {
        id: `dynamic-raw-point-${objectCount}`,
        name: `Dynamic Raw Point ${objectCount}`,
        color: color,
        positions: [Cartesian3.fromDegrees(lon, lat, alt)],
        view: "dynamic-raw",
        renderType: "points" as const,
      };
    } else {
      // Create rocket data - single point with 🚀 emoji
      layerData = {
        id: `dynamic-raw-rocket-${objectCount}`,
        name: `🚀 Dynamic Rocket ${objectCount}`,
        color: color,
        positions: [Cartesian3.fromDegrees(lon, lat, alt + 100)], // Start higher
        view: "dynamic-raw",
        renderType: "points" as const, // Rockets are rendered as points with emoji
      };
    }

    // Use DataManager's addDataItem for automatic renderer resolution
    const mapEntity = dataManager.addDataItem(layerData, "dynamic-raw");

    if (!mapEntity) return;

    // Get native Cesium entity for direct property access
    const entity = mapEntity.getNativeEntity<Entity>();

    // Make points bigger after creation, rockets even bigger
    if (currentType === "points" && entity.point) {
      entity.point.pixelSize = new ConstantProperty(25);
    } else if (currentType === "rockets" && entity.point) {
      entity.point.pixelSize = new ConstantProperty(1); // Rockets are bigger

      // Add rocket emoji label above the rocket
      entity.label = new LabelGraphics({
        text: new ConstantProperty("🚀"),
        font: new ConstantProperty("36px sans-serif"),
        fillColor: new ConstantProperty(color),
        outlineColor: new ConstantProperty(Color.BLACK),
        outlineWidth: new ConstantProperty(2),
        pixelOffset: new ConstantProperty(new Cartesian2(0, -25)),
        style: new ConstantProperty(0),
      });
    }
  };

  return (
    <div className="dynamic-panel">
      <h3>Dynamic Raw Data</h3>
      <div className="button-group">
        <div className="type-buttons-container">
          <button
            className={`type-button ${currentType === "points" ? "active" : ""
              }`}
            onClick={() => setCurrentType("points")}
          >
            Points
          </button>
          <button
            className={`type-button ${currentType === "rockets" ? "active" : ""
              }`}
            onClick={() => setCurrentType("rockets")}
          >
            Rockets
          </button>
        </div>
        <button className="add-dynamic-button" onClick={addDynamicObject}>
          Add Dynamic Raw {currentType === "points" ? "Point" : "Rocket"}
        </button>
        <button
          className={`animation-button ${isAnimating ? "animating" : ""}`}
          onClick={toggleAnimation}
          disabled={!hasDynamicEntities()}
        >
          {isAnimating ? "⏸️ Stop Animation" : "▶️ Start Animation"}
        </button>
      </div>
    </div>
  );
};

export default DynamicRawDataPanel;
