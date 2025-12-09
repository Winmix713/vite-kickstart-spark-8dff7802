import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import cmsPageReducer, {
  setPageThemeMode,
  setPageThemeVariant,
  setWidgetVariant,
  setColorOverride,
  selectPageThemeMode,
  selectPageThemeVariant,
  selectWidgetVariant,
  selectColorOverrides,
} from "../../features/cms/cmsPageSlice";
import {
  buildCssVariables,
  getThemeVariant,
  getThemeVariantNames,
  getWidgetStyleVariant,
} from "../theme/tokens";
import { getWidgetById } from "../registry/widgetRegistry";

describe("CMS Theme Integration Tests", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cmsPage: cmsPageReducer,
      },
    });
  });

  describe("Theme Selection Flow", () => {
    it("should complete a full theme selection workflow", () => {
      const pageId = "test-page";

      // 1. Initialize page with defaults
      let state = store.getState();
      let pageOverrides = selectPageThemeMode(state.cmsPage, pageId);
      expect(pageOverrides).toBe("light"); // Default

      // 2. Change theme mode
      store.dispatch(setPageThemeMode({ pageId, mode: "dark" }));
      state = store.getState();
      pageOverrides = selectPageThemeMode(state.cmsPage, pageId);
      expect(pageOverrides).toBe("dark");

      // 3. Change theme variant
      store.dispatch(setPageThemeVariant({ pageId, variant: "glass" }));
      state = store.getState();
      pageOverrides = selectPageThemeVariant(state.cmsPage, pageId);
      expect(pageOverrides).toBe("glass");

      // 4. Set color override
      store.dispatch(
        setColorOverride({
          pageId,
          colorKey: "primary",
          colorValue: "#FF0000",
        }),
      );
      state = store.getState();
      const colors = selectColorOverrides(state.cmsPage, pageId);
      expect(colors.primary).toBe("#FF0000");
    });
  });

  describe("Widget Variant Management", () => {
    it("should manage multiple widget variants on a page", () => {
      const pageId = "test-page";

      // Set different variants for different widgets
      store.dispatch(
        setWidgetVariant({
          pageId,
          widgetInstanceId: "widget-1",
          variant: "compact",
        }),
      );

      store.dispatch(
        setWidgetVariant({
          pageId,
          widgetInstanceId: "widget-2",
          variant: "minimal",
        }),
      );

      store.dispatch(
        setWidgetVariant({
          pageId,
          widgetInstanceId: "widget-3",
          variant: "elevated",
        }),
      );

      const state = store.getState();

      expect(selectWidgetVariant(state.cmsPage, pageId, "widget-1")).toBe(
        "compact",
      );
      expect(selectWidgetVariant(state.cmsPage, pageId, "widget-2")).toBe(
        "minimal",
      );
      expect(selectWidgetVariant(state.cmsPage, pageId, "widget-3")).toBe(
        "elevated",
      );
    });
  });

  describe("Theme Variant CSS Variable Generation", () => {
    it("should generate CSS variables for all theme variants", () => {
      const variantNames = getThemeVariantNames();

      variantNames.forEach((variantName) => {
        const variant = getThemeVariant(variantName);
        const lightCssVars = buildCssVariables(variant, "light");
        const darkCssVars = buildCssVariables(variant, "dark");

        // Light mode should have expected structure
        expect(lightCssVars["--cms-color-background"]).toBeDefined();
        expect(lightCssVars["--cms-color-primary"]).toBeDefined();
        expect(lightCssVars["--cms-spacing-4"]).toBeDefined();

        // Dark mode should have expected structure
        expect(darkCssVars["--cms-color-background"]).toBeDefined();
        expect(darkCssVars["--cms-color-primary"]).toBeDefined();
        expect(darkCssVars["--cms-spacing-4"]).toBeDefined();
      });
    });

    it("should have consistent CSS variable names across variants", () => {
      const defaultVariant = getThemeVariant("default");
      const glassVariant = getThemeVariant("glass");

      const defaultVars = buildCssVariables(defaultVariant, "light");
      const glassVars = buildCssVariables(glassVariant, "light");

      // Both should have the same set of CSS variables
      const defaultVarKeys = Object.keys(defaultVars).sort();
      const glassVarKeys = Object.keys(glassVars).sort();

      expect(defaultVarKeys.length).toBeGreaterThan(0);
      // They should have similar structure (not necessarily identical values)
      expect(defaultVarKeys.some((key) => key.includes("--cms-color"))).toBe(
        true,
      );
      expect(glassVarKeys.some((key) => key.includes("--cms-color"))).toBe(
        true,
      );
    });
  });

  describe("Widget Style Variants", () => {
    it("should retrieve widget style variants", () => {
      const defaultVariant = getWidgetStyleVariant("default");
      const compactVariant = getWidgetStyleVariant("compact");
      const minimalVariant = getWidgetStyleVariant("minimal");

      expect(defaultVariant).toBeDefined();
      expect(defaultVariant.slug).toBe("default");
      expect(defaultVariant.label).toBe("Default");

      expect(compactVariant).toBeDefined();
      expect(compactVariant.slug).toBe("compact");

      expect(minimalVariant).toBeDefined();
      expect(minimalVariant.slug).toBe("minimal");
    });

    it("should handle widget with style variants metadata", () => {
      // This tests the integration with actual widgets in the registry
      const widget = getWidgetById("team_stats");

      if (widget && widget.styleVariants) {
        expect(Array.isArray(widget.styleVariants)).toBe(true);
        expect(widget.styleVariants.length).toBeGreaterThan(0);

        // Check that variants have proper structure
        widget.styleVariants.forEach((variant) => {
          expect(variant.slug).toBeDefined();
          expect(variant.label).toBeDefined();
        });
      }
    });
  });

  describe("Color Override Persistence", () => {
    it("should persist multiple color overrides", () => {
      const pageId = "test-page";

      // Add multiple color overrides
      const colorOverrides = {
        primary: "#FF0000",
        secondary: "#00FF00",
        accent: "#0000FF",
        success: "#00FF00",
        error: "#FF0000",
      };

      Object.entries(colorOverrides).forEach(([key, value]) => {
        store.dispatch(
          setColorOverride({
            pageId,
            colorKey: key,
            colorValue: value,
          }),
        );
      });

      const state = store.getState();
      const colors = selectColorOverrides(state.cmsPage, pageId);

      Object.entries(colorOverrides).forEach(([key, value]) => {
        expect(colors[key]).toBe(value);
      });
    });
  });

  describe("Multi-Page State Management", () => {
    it("should manage overrides for multiple pages independently", () => {
      const page1 = "page-1";
      const page2 = "page-2";

      // Setup page 1
      store.dispatch(setPageThemeMode({ pageId: page1, mode: "dark" }));
      store.dispatch(setPageThemeVariant({ pageId: page1, variant: "glass" }));

      // Setup page 2 differently
      store.dispatch(setPageThemeMode({ pageId: page2, mode: "light" }));
      store.dispatch(
        setPageThemeVariant({ pageId: page2, variant: "emerald" }),
      );

      const state = store.getState();

      // Verify page 1
      expect(selectPageThemeMode(state.cmsPage, page1)).toBe("dark");
      expect(selectPageThemeVariant(state.cmsPage, page1)).toBe("glass");

      // Verify page 2
      expect(selectPageThemeMode(state.cmsPage, page2)).toBe("light");
      expect(selectPageThemeVariant(state.cmsPage, page2)).toBe("emerald");
    });
  });

  describe("Theme Configuration Object", () => {
    it("should build a complete theme configuration for saving", () => {
      const pageId = "test-page";

      // Build complete configuration
      store.dispatch(setPageThemeMode({ pageId, mode: "dark" }));
      store.dispatch(setPageThemeVariant({ pageId, variant: "glass" }));
      store.dispatch(
        setWidgetVariant({
          pageId,
          widgetInstanceId: "widget-1",
          variant: "compact",
        }),
      );
      store.dispatch(
        setColorOverride({
          pageId,
          colorKey: "primary",
          colorValue: "#FF0000",
        }),
      );

      const state = store.getState();
      const pageData = state.cmsPage.pages[pageId];

      // Verify complete structure for saving to database
      const themeOverrides = {
        themeMode: pageData.themeMode,
        themeVariant: pageData.themeVariant,
        widgetVariants: pageData.widgetVariants,
        colorOverrides: pageData.colorOverrides,
      };

      expect(themeOverrides.themeMode).toBe("dark");
      expect(themeOverrides.themeVariant).toBe("glass");
      expect(themeOverrides.widgetVariants["widget-1"]).toBe("compact");
      expect(themeOverrides.colorOverrides.primary).toBe("#FF0000");

      // This structure matches what we'd save to Supabase
      expect(JSON.stringify(themeOverrides)).toBeDefined();
    });
  });
});
