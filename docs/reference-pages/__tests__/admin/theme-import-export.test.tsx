import { describe, it, expect } from "vitest";

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
    };
  };
}

const validateThemeJson = (data: unknown): boolean => {
  if (typeof data !== "object" || data === null) return false;

  const theme = data as ThemePreset;

  if (
    typeof theme.id !== "string" ||
    typeof theme.name !== "string" ||
    typeof theme.description !== "string"
  ) {
    return false;
  }

  // Validate colors
  const colors = theme.colors;
  if (
    !colors ||
    typeof colors.primary !== "string" ||
    typeof colors.secondary !== "string" ||
    typeof colors.accent !== "string" ||
    typeof colors.background !== "string" ||
    typeof colors.foreground !== "string"
  ) {
    return false;
  }

  // Validate hex color format (basic check)
  const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  if (
    !hexRegex.test(colors.primary) ||
    !hexRegex.test(colors.secondary) ||
    !hexRegex.test(colors.accent) ||
    !hexRegex.test(colors.background) ||
    !hexRegex.test(colors.foreground)
  ) {
    return false;
  }

  // Validate typography
  const typography = theme.typography;
  if (
    !typography ||
    typeof typography.fontFamily !== "string" ||
    !typography.fontSize ||
    typeof typography.fontSize.xs !== "number" ||
    typeof typography.fontSize.sm !== "number" ||
    typeof typography.fontSize.base !== "number" ||
    typeof typography.fontSize.lg !== "number" ||
    typeof typography.fontSize.xl !== "number"
  ) {
    return false;
  }

  return true;
};

const exportTheme = (theme: ThemePreset): string => {
  return JSON.stringify(theme, null, 2);
};

const importTheme = (jsonString: string): ThemePreset => {
  const parsed = JSON.parse(jsonString);
  if (!validateThemeJson(parsed)) {
    throw new Error("Invalid theme JSON format");
  }
  return parsed as ThemePreset;
};

describe("Theme Import/Export", () => {
  const mockTheme: ThemePreset = {
    id: "emerald-dark",
    name: "Emerald Dark",
    description: "Premium dark theme",
    colors: {
      primary: "#10b981",
      secondary: "#f97316",
      accent: "#10b981",
      background: "#0f172a",
      foreground: "#f1f5f9",
    },
    typography: {
      fontFamily: "Inter",
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
      },
    },
  };

  describe("exportTheme", () => {
    it("should export theme as valid JSON", () => {
      const result = exportTheme(mockTheme);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should preserve all theme properties", () => {
      const exported = exportTheme(mockTheme);
      const parsed = JSON.parse(exported) as ThemePreset;

      expect(parsed).toEqual(mockTheme);
    });

    it("should preserve color values", () => {
      const exported = exportTheme(mockTheme);
      const parsed = JSON.parse(exported) as ThemePreset;

      expect(parsed.colors.primary).toBe("#10b981");
      expect(parsed.colors.secondary).toBe("#f97316");
    });

    it("should preserve typography settings", () => {
      const exported = exportTheme(mockTheme);
      const parsed = JSON.parse(exported) as ThemePreset;

      expect(parsed.typography.fontFamily).toBe("Inter");
      expect(parsed.typography.fontSize.base).toBe(16);
    });
  });

  describe("importTheme", () => {
    it("should import valid JSON", () => {
      const exported = exportTheme(mockTheme);
      const imported = importTheme(exported);

      expect(imported).toEqual(mockTheme);
    });

    it("should validate color format", () => {
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: "not-a-hex-color",
        },
      });

      expect(() => importTheme(invalidTheme)).toThrow();
    });

    it("should validate required properties", () => {
      const incompleteTheme = JSON.stringify({
        id: "test",
        name: "Test",
        // Missing description and other properties
      });

      expect(() => importTheme(incompleteTheme)).toThrow();
    });

    it("should validate typography numbers", () => {
      const invalidTheme = JSON.stringify({
        ...mockTheme,
        typography: {
          ...mockTheme.typography,
          fontSize: {
            ...mockTheme.typography.fontSize,
            base: "not-a-number",
          },
        },
      });

      expect(() => importTheme(invalidTheme)).toThrow();
    });
  });

  describe("validateThemeJson", () => {
    it("should validate correct theme", () => {
      expect(validateThemeJson(mockTheme)).toBe(true);
    });

    it("should reject non-object", () => {
      expect(validateThemeJson("not-a-theme")).toBe(false);
      expect(validateThemeJson([])).toBe(false);
      expect(validateThemeJson(null)).toBe(false);
    });

    it("should reject invalid hex colors", () => {
      const invalid = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: "#GGGGGG",
        },
      };
      expect(validateThemeJson(invalid)).toBe(false);
    });

    it("should reject short hex colors without standard format", () => {
      const invalid = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: "#1gb",
        },
      };
      expect(validateThemeJson(invalid)).toBe(false);
    });

    it("should accept 3-digit hex colors", () => {
      const valid = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: "#abc",
        },
      };
      expect(validateThemeJson(valid)).toBe(true);
    });

    it("should reject missing typography data", () => {
      const invalid = {
        ...mockTheme,
        typography: null,
      };
      expect(validateThemeJson(invalid)).toBe(false);
    });
  });

  describe("Round-trip operations", () => {
    it("should preserve data through export and import cycle", () => {
      const exported = exportTheme(mockTheme);
      const imported = importTheme(exported);
      const reexported = exportTheme(imported);

      expect(JSON.parse(reexported)).toEqual(mockTheme);
    });

    it("should handle multiple round-trips", () => {
      let theme = mockTheme;

      for (let i = 0; i < 5; i++) {
        const exported = exportTheme(theme);
        theme = importTheme(exported);
      }

      expect(theme).toEqual(mockTheme);
    });

    it("should handle theme variations", () => {
      const variations = [
        { ...mockTheme, id: "azure-dark", name: "Azure Dark" },
        { ...mockTheme, id: "violet-dark", name: "Violet Dark" },
      ];

      variations.forEach((variant) => {
        const exported = exportTheme(variant);
        const imported = importTheme(exported);
        expect(imported).toEqual(variant);
      });
    });
  });
});
