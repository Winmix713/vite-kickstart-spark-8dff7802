import { describe, it, expect } from "vitest";
import {
  buildCssVariables,
  getThemeVariant,
  getThemeVariantNames,
  getWidgetStyleVariant,
  getWidgetStyleVariantSlugs,
  themeVariants,
  widgetStyleVariants,
} from "../theme/tokens";

describe("Theme Tokens", () => {
  describe("buildCssVariables", () => {
    it("should build CSS variables from theme tokens for light mode", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "light");

      expect(cssVars["--cms-color-background"]).toBe("#ffffff");
      expect(cssVars["--cms-color-foreground"]).toBe("#111827");
      expect(cssVars["--cms-color-primary"]).toBe("#2563eb");
    });

    it("should build CSS variables from theme tokens for dark mode", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "dark");

      expect(cssVars["--cms-color-background"]).toBe("#111827");
      expect(cssVars["--cms-color-foreground"]).toBe("#f9fafb");
      expect(cssVars["--cms-color-primary"]).toBe("#60a5fa");
    });

    it("should include typography CSS variables", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "light");

      expect(cssVars["--cms-font-size-base"]).toBe("1rem");
      expect(cssVars["--cms-font-size-lg"]).toBe("1.125rem");
      expect(cssVars["--cms-font-weight-bold"]).toBe(700);
    });

    it("should include spacing CSS variables", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "light");

      expect(cssVars["--cms-spacing-0"]).toBe("0");
      expect(cssVars["--cms-spacing-4"]).toBe("1rem");
      expect(cssVars["--cms-spacing-8"]).toBe("2rem");
    });

    it("should include radius CSS variables", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "light");

      expect(cssVars["--cms-radius-none"]).toBe("0");
      expect(cssVars["--cms-radius-lg"]).toBe("0.5rem");
      expect(cssVars["--cms-radius-full"]).toBe("9999px");
    });

    it("should include shadow CSS variables", () => {
      const variant = getThemeVariant("default");
      const cssVars = buildCssVariables(variant, "light");

      expect(cssVars["--cms-shadow-none"]).toBe("none");
      expect(cssVars["--cms-shadow-sm"]).toBeDefined();
      expect(cssVars["--cms-shadow-lg"]).toBeDefined();
    });
  });

  describe("getThemeVariant", () => {
    it("should return the default variant", () => {
      const variant = getThemeVariant("default");
      expect(variant).toBeDefined();
      expect(variant.name).toBe("Default");
    });

    it("should return the glass variant", () => {
      const variant = getThemeVariant("glass");
      expect(variant).toBeDefined();
      expect(variant.name).toBe("Glass");
    });

    it("should return the emerald variant", () => {
      const variant = getThemeVariant("emerald");
      expect(variant).toBeDefined();
      expect(variant.name).toBe("Emerald");
    });

    it("should return the dark variant", () => {
      const variant = getThemeVariant("dark");
      expect(variant).toBeDefined();
      expect(variant.name).toBe("Dark");
    });

    it("should return null for non-existent variant", () => {
      const variant = getThemeVariant("nonexistent");
      expect(variant).toBeNull();
    });

    it("should have both light and dark colors", () => {
      const variant = getThemeVariant("default");
      expect(variant.colors.light).toBeDefined();
      expect(variant.colors.dark).toBeDefined();
      expect(variant.colors.light.background).toBeDefined();
      expect(variant.colors.dark.background).toBeDefined();
    });
  });

  describe("getThemeVariantNames", () => {
    it("should return an array of variant names", () => {
      const names = getThemeVariantNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it("should include default variant", () => {
      const names = getThemeVariantNames();
      expect(names).toContain("default");
    });

    it("should include glass variant", () => {
      const names = getThemeVariantNames();
      expect(names).toContain("glass");
    });

    it("should include emerald variant", () => {
      const names = getThemeVariantNames();
      expect(names).toContain("emerald");
    });

    it("should include dark variant", () => {
      const names = getThemeVariantNames();
      expect(names).toContain("dark");
    });
  });

  describe("Widget Style Variants", () => {
    it("should return the default widget style variant", () => {
      const variant = getWidgetStyleVariant("default");
      expect(variant).toBeDefined();
      expect(variant.slug).toBe("default");
      expect(variant.label).toBe("Default");
    });

    it("should return the compact widget style variant", () => {
      const variant = getWidgetStyleVariant("compact");
      expect(variant).toBeDefined();
      expect(variant.slug).toBe("compact");
    });

    it("should return the minimal widget style variant", () => {
      const variant = getWidgetStyleVariant("minimal");
      expect(variant).toBeDefined();
      expect(variant.slug).toBe("minimal");
    });

    it("should return null for non-existent widget variant", () => {
      const variant = getWidgetStyleVariant("nonexistent");
      expect(variant).toBeNull();
    });

    it("should have supportedTokens", () => {
      const variant = getWidgetStyleVariant("default");
      expect(Array.isArray(variant.supportedTokens)).toBe(true);
    });
  });

  describe("getWidgetStyleVariantSlugs", () => {
    it("should return an array of widget variant slugs", () => {
      const slugs = getWidgetStyleVariantSlugs();
      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs.length).toBeGreaterThan(0);
    });

    it("should include default variant slug", () => {
      const slugs = getWidgetStyleVariantSlugs();
      expect(slugs).toContain("default");
    });

    it("should include compact variant slug", () => {
      const slugs = getWidgetStyleVariantSlugs();
      expect(slugs).toContain("compact");
    });
  });

  describe("Theme Variant Colors", () => {
    it("should have all required color properties in light mode", () => {
      const variant = getThemeVariant("default");
      const colors = variant.colors.light;

      const requiredColors = [
        "background",
        "foreground",
        "surface",
        "border",
        "muted",
        "primary",
        "primary_foreground",
        "secondary",
        "secondary_foreground",
        "accent",
        "success",
        "warning",
        "error",
        "info",
      ];

      requiredColors.forEach((color) => {
        expect(colors[color.replace(/_/g, "_")]).toBeDefined();
      });
    });

    it("should have all required color properties in dark mode", () => {
      const variant = getThemeVariant("default");
      const colors = variant.colors.dark;

      const requiredColors = [
        "background",
        "foreground",
        "surface",
        "border",
        "muted",
        "primary",
        "primary_foreground",
        "secondary",
        "secondary_foreground",
        "accent",
        "success",
        "warning",
        "error",
        "info",
      ];

      requiredColors.forEach((color) => {
        expect(colors[color.replace(/_/g, "_")]).toBeDefined();
      });
    });
  });

  describe("Emerald Variant", () => {
    it("should use emerald colors for primary theme", () => {
      const variant = getThemeVariant("emerald");
      expect(variant.colors.light.primary).toContain("10b981");
    });

    it("should use emerald surface color in light mode", () => {
      const variant = getThemeVariant("emerald");
      expect(variant.colors.light.surface).toContain("0fdf4");
    });
  });

  describe("Glass Variant", () => {
    it("should use rgba colors for glass effect", () => {
      const variant = getThemeVariant("glass");
      expect(variant.colors.light.background).toContain("rgba");
    });

    it("should have different shadow values for glass effect", () => {
      const variant = getThemeVariant("glass");
      expect(variant.shadows.sm).toContain("32px");
    });
  });

  describe("Theme Variant Consistency", () => {
    it("all variants should have typography defined", () => {
      getThemeVariantNames().forEach((name) => {
        const variant = getThemeVariant(name);
        expect(variant.typography).toBeDefined();
      });
    });

    it("all variants should have spacing defined", () => {
      getThemeVariantNames().forEach((name) => {
        const variant = getThemeVariant(name);
        expect(variant.spacing).toBeDefined();
      });
    });

    it("all variants should have radii defined", () => {
      getThemeVariantNames().forEach((name) => {
        const variant = getThemeVariant(name);
        expect(variant.radii).toBeDefined();
      });
    });

    it("all variants should have shadows defined", () => {
      getThemeVariantNames().forEach((name) => {
        const variant = getThemeVariant(name);
        expect(variant.shadows).toBeDefined();
      });
    });
  });
});
