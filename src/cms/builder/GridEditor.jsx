import React, { useCallback } from "react";
import GridLayout from "react-grid-layout";
import { WidgetRenderer } from "../index";
import { useSelector, useDispatch } from "react-redux";
import {
  updateInstanceLayout,
  selectInstance,
  removeInstance,
  duplicateInstance,
} from "../../features/pageBuilder/pageBuilderSlice";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./builder.css";

export const GridEditor = () => {
  const dispatch = useDispatch();
  const { layout, instancesById, selectedInstanceId } = useSelector(
    (state) => state.pageBuilder,
  );

  const handleLayoutChange = useCallback(
    (newLayout) => {
      dispatch(updateInstanceLayout(newLayout));
    },
    [dispatch],
  );

  const handleWidgetDrop = useCallback((layout, layoutItem, _event) => {
    const data = JSON.parse(_event.dataTransfer.getData("text/plain"));

    // Create a new instance from dropped widget data
    const newInstance = {
      id: `${data.type}-${Date.now()}`,
      type: data.type,
      props: data.defaultProps || {},
      layout: {
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w || 3,
        h: layoutItem.h || 2,
        i: `${data.type}-${Date.now()}`,
      },
    };

    // Dispatch action to add the new instance
    // This would be handled by the drop handler in BuilderLayout
    console.log("Widget dropped:", newInstance);
  }, []);

  const handleWidgetClick = useCallback(
    (instanceId) => {
      dispatch(selectInstance(instanceId));
    },
    [dispatch],
  );

  const handleRemoveWidget = useCallback(
    (instanceId, e) => {
      e.stopPropagation();
      dispatch(removeInstance(instanceId));
    },
    [dispatch],
  );

  const handleDuplicateWidget = useCallback(
    (instanceId, e) => {
      e.stopPropagation();
      dispatch(duplicateInstance(instanceId));
    },
    [dispatch],
  );

  return (
    <div className="grid-editor h-full relative">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        onLayoutChange={handleLayoutChange}
        onDrop={handleWidgetDrop}
        isDraggable={true}
        isResizable={true}
        isDroppable={true}
        compactType={null}
        preventCollision={false}
        margin={[16, 16]}
      >
        {layout.map((item) => {
          const instance = instancesById[item.i];
          if (!instance) return null;

          const isSelected = selectedInstanceId === item.i;

          return (
            <div
              key={item.i}
              className={`grid-item ${isSelected ? "selected" : ""}`}
              onClick={() => handleWidgetClick(item.i)}
            >
              {/* Widget Actions */}
              <div className="widget-actions absolute top-2 right-2 z-10 flex gap-1">
                <button
                  onClick={(e) => handleDuplicateWidget(item.i, e)}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Duplicate"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleRemoveWidget(item.i, e)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="selection-indicator absolute inset-0 border-2 border-blue-500 pointer-events-none" />
              )}

              {/* Widget Content */}
              <div className="widget-content h-full overflow-auto">
                <WidgetRenderer
                  widgetType={instance.type}
                  props={instance.props}
                  isBuilderPreview={true}
                />
              </div>
            </div>
          );
        })}
      </GridLayout>

      {layout.length === 0 && (
        <div className="grid-placeholder flex flex-col items-center justify-center h-full text-gray-400">
          <div className="mb-4">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">
            Drop widgets here to get started
          </p>
          <p className="text-sm mt-1">
            Drag from the widget picker or click to add
          </p>
        </div>
      )}
    </div>
  );
};
