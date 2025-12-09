import React, { useState, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./GridEditor.scss";

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * GridEditor Component
 * Editable grid layout for page builder
 */
function GridEditor({ pageId, layout, onLayoutChange }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleLayoutChange = useCallback(
    (newLayout, layouts) => {
      if (onLayoutChange && layout) {
        onLayoutChange({
          ...layout,
          layout: newLayout,
        });
      }
    },
    [layout, onLayoutChange],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!layout || !layout.instances) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No layout data available</p>
      </div>
    );
  }

  const gridLayout = layout.layout || [];
  const instances = layout.instances || {};

  return (
    <div className="grid-editor">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={120}
        width={1200}
        isDraggable={true}
        isResizable={true}
        containerPadding={[16, 16]}
        margin={[16, 16]}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
      >
        {gridLayout.map((item) => {
          const instance = instances[item.i];
          return (
            <div
              key={item.i}
              className="grid-item bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors p-4"
            >
              <div className="flex flex-col h-full">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  {instance?.type || item.i}
                </div>
                {instance?.title && (
                  <div className="text-xs text-gray-500">{instance.title}</div>
                )}
                <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
                  {instance?.description || "Widget Preview"}
                </div>
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}

export default GridEditor;
