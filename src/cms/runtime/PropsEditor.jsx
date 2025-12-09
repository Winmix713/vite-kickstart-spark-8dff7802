import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setPageThemeMode,
  setPageThemeVariant,
  setWidgetVariant,
  setColorOverride,
  removeColorOverride,
  selectPageThemeMode,
  selectPageThemeVariant,
  selectWidgetVariant,
  selectColorOverrides,
} from "@features/cms/cmsPageSlice";
import { getThemeVariantNames, getWidgetStyleVariant } from "@cms/theme/tokens";
import { widgetRegistry } from "@cms/registry/widgetRegistry";

/**
 * Props Editor Component
 *
 * Allows editors to:
 * - Toggle page-level light/dark theme
 * - Select theme variant (default, glass, emerald, dark)
 * - Choose variant per widget
 * - Edit token overrides (colors, spacing)
 *
 * Dispatches Redux actions to persist selections
 */
const PropsEditor = ({ pageId, onSave }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("theme");
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [colorPicker, setColorPicker] = useState(null);

  // Get page theme data from Redux
  const pageThemeMode = useSelector((state) =>
    selectPageThemeMode(state, pageId),
  );
  const pageThemeVariant = useSelector((state) =>
    selectPageThemeVariant(state, pageId),
  );
  const colorOverrides = useSelector((state) =>
    selectColorOverrides(state, pageId),
  );

  // Get available theme variants
  const themeVariantNames = getThemeVariantNames();
  const themeVariantOptions = themeVariantNames.map((name) => ({
    value: name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
  }));

  // Handle theme mode toggle
  const handleThemeModeToggle = useCallback(() => {
    const newMode = pageThemeMode === "light" ? "dark" : "light";
    dispatch(setPageThemeMode({ pageId, mode: newMode }));
  }, [dispatch, pageId, pageThemeMode]);

  // Handle theme variant change
  const handleVariantChange = useCallback(
    (e) => {
      const variant = e.target.value;
      dispatch(setPageThemeVariant({ pageId, variant }));
    },
    [dispatch, pageId],
  );

  // Handle widget variant change
  const handleWidgetVariantChange = useCallback(
    (widgetInstanceId, variant) => {
      dispatch(setWidgetVariant({ pageId, widgetInstanceId, variant }));
    },
    [dispatch, pageId],
  );

  // Handle color override
  const handleColorChange = useCallback(
    (colorKey, colorValue) => {
      dispatch(setColorOverride({ pageId, colorKey, colorValue }));
      setColorPicker(null);
    },
    [dispatch, pageId],
  );

  // Handle color override removal
  const handleColorRemove = useCallback(
    (colorKey) => {
      dispatch(removeColorOverride({ pageId, colorKey }));
    },
    [dispatch, pageId],
  );

  return (
    <div className="props-editor">
      <div className="props-editor__header">
        <h3>Page Props Editor</h3>
        {onSave && (
          <button onClick={onSave} className="props-editor__save-btn">
            Save Changes
          </button>
        )}
      </div>

      <div className="props-editor__tabs">
        <button
          className={`props-editor__tab ${activeTab === "theme" ? "active" : ""}`}
          onClick={() => setActiveTab("theme")}
        >
          Theme & Variant
        </button>
        <button
          className={`props-editor__tab ${activeTab === "colors" ? "active" : ""}`}
          onClick={() => setActiveTab("colors")}
        >
          Colors
        </button>
        <button
          className={`props-editor__tab ${activeTab === "widgets" ? "active" : ""}`}
          onClick={() => setActiveTab("widgets")}
        >
          Widget Variants
        </button>
      </div>

      <div className="props-editor__content">
        {/* Theme & Variant Tab */}
        {activeTab === "theme" && (
          <div className="props-editor__section">
            <div className="props-editor__group">
              <label>Page Theme Mode</label>
              <div className="props-editor__toggle">
                <button
                  className={`toggle-btn ${pageThemeMode === "light" ? "active" : ""}`}
                  onClick={handleThemeModeToggle}
                >
                  ☀️ Light
                </button>
                <button
                  className={`toggle-btn ${pageThemeMode === "dark" ? "active" : ""}`}
                  onClick={handleThemeModeToggle}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            <div className="props-editor__group">
              <label htmlFor="variant-select">Theme Variant</label>
              <select
                id="variant-select"
                value={pageThemeVariant}
                onChange={handleVariantChange}
                className="props-editor__select"
              >
                {themeVariantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === "colors" && (
          <div className="props-editor__section">
            <div className="props-editor__color-grid">
              {Object.entries(colorOverrides || {}).map(([key, value]) => (
                <div key={key} className="props-editor__color-item">
                  <div
                    className="props-editor__color-preview"
                    style={{ backgroundColor: value }}
                  />
                  <span className="props-editor__color-label">{key}</span>
                  <button
                    className="props-editor__color-remove"
                    onClick={() => handleColorRemove(key)}
                    title="Remove override"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="props-editor__color-item props-editor__color-item--add">
                <button
                  className="props-editor__add-color"
                  onClick={() => setColorPicker(colorPicker ? null : "new")}
                >
                  + Add Color
                </button>
              </div>
            </div>

            {colorPicker && (
              <div className="props-editor__color-picker-panel">
                <input
                  type="color"
                  defaultValue="#2563eb"
                  onChange={(e) => {
                    const colorKey = prompt("Enter color key name:");
                    if (colorKey) {
                      handleColorChange(colorKey, e.target.value);
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Widget Variants Tab */}
        {activeTab === "widgets" && (
          <div className="props-editor__section">
            <div className="props-editor__widget-list">
              {widgetRegistry.map((widget) => (
                <div key={widget.id} className="props-editor__widget-item">
                  <h4>{widget.name}</h4>
                  {widget.styleVariants && widget.styleVariants.length > 0 ? (
                    <div className="props-editor__variant-options">
                      {widget.styleVariants.map((variant) => (
                        <label
                          key={variant.slug}
                          className="props-editor__variant-label"
                        >
                          <input
                            type="radio"
                            name={`widget-variant-${widget.id}`}
                            value={variant.slug}
                            onChange={(e) =>
                              handleWidgetVariantChange(
                                widget.id,
                                e.target.value,
                              )
                            }
                            defaultChecked={variant.slug === "default"}
                          />
                          <span>{variant.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="props-editor__no-variants">
                      No style variants available
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropsEditor;
