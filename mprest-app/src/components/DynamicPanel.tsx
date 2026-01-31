import { useState, useEffect, useRef } from "react";
import { useMemo } from "react";
import { Cartesian3, Color, Math as CesiumMath, JulianDate, ConstantPositionProperty, type Entity } from "cesium";
import { useViewer } from "@mprest/map-core";
import { DataManager, type RendererRegistry, type ViewerWithConfigs } from "@mprest/map-cesium";

interface DynamicPanelProps {
  renderers: RendererRegistry;
}

const DynamicPanel = ({ renderers }: DynamicPanelProps) => {
  const { viewer: coreViewer } = useViewer();
  // Cast to Cesium-specific viewer type
  const viewer = coreViewer as unknown as ViewerWithConfigs | null;
  const dataManager = useMemo(
    () => (viewer ? new DataManager(viewer) : null),
    [viewer],
  );
  const [objectCount, setObjectCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Check if there are entities in the dynamic layer
  const hasDynamicEntities = () => {
    if (!dataManager) return false;
    try {
      const entities = dataManager.getLayerItems("dynamic");
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

      const entities = dataManager.getLayerItems("dynamic");
      const elapsed = time - startTime;

      if (!entities) return;

      entities.forEach((mapEntity) => {
        const entity = mapEntity.getNativeEntity<Entity>();
        if (!entity.position) return;

        // Get original position for this entity (stored in a custom property or calculate from ID)
        const entityId = mapEntity.id;
        const match = entityId.match(/dynamic-point-(\d+)/);
        if (!match) return;

        const entityIndex = parseInt(match[1]);
        // Create circular motion with different phases for each entity
        const radius = 1.0; // Much bigger radius in degrees (~100km)
        const speed = 0.005; // Increased speed factor (5x faster)
        const phase = (entityIndex * Math.PI) / 4; // Different phase for each entity

        const angle = elapsed * speed + phase;
        const offsetLon = radius * Math.cos(angle);
        const offsetLat = radius * Math.sin(angle);

        // Get current position and add circular offset
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

    // Bold solid colors for points
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

    // Use points renderer
    const pointsRenderer = renderers.points;
    if (!pointsRenderer) return;

    const layerData = {
      id: `dynamic-point-${objectCount}`,
      name: `Dynamic Point ${objectCount}`,
      color: color,
      positions: [Cartesian3.fromDegrees(lon, lat, alt)],
      view: "dynamic",
      renderType: "points" as const,
    };

    const entityOptions = pointsRenderer(layerData);

    // Make point larger and more visible
    if (entityOptions.point) {
      entityOptions.point.pixelSize = 20;
    }

    // Add label
    // entityOptions.label = {
    //   text: `Dynamic ${objectCount}`,
    //   fillColor: color,
    //   outlineColor: Color.BLACK,
    //   outlineWidth: 2,
    //   pixelOffset: new Cartesian2(0, -30), // Higher offset for larger point
    // };

    dataManager.addCesiumItem(entityOptions, "dynamic", layerData.renderType);
  };

  return (
    <div className="dynamic-panel">
      <h3>Dynamic</h3>
      <div className="button-group">
        <button className="add-dynamic-button" onClick={addDynamicObject}>
          Add Dynamic Object
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

export default DynamicPanel;
