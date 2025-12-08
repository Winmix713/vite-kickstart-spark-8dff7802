import { describe, it, expect, vi } from "vitest";

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  category: string;
}

const validateFeatureJson = (data: unknown): boolean => {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.description === "string" &&
      typeof item.enabled === "boolean" &&
      typeof item.rollout === "number" &&
      item.rollout >= 0 &&
      item.rollout <= 100 &&
      typeof item.category === "string"
    );
  });
};

const exportFeatures = (features: Feature[]): string => {
  return JSON.stringify(features, null, 2);
};

const importFeatures = (jsonString: string): Feature[] => {
  const parsed = JSON.parse(jsonString);
  if (!validateFeatureJson(parsed)) {
    throw new Error("Invalid feature JSON format");
  }
  return parsed as Feature[];
};

describe("Feature Import/Export", () => {
  const mockFeatures: Feature[] = [
    {
      id: "feature-1",
      name: "Feature One",
      description: "First feature",
      enabled: true,
      rollout: 100,
      category: "Core",
    },
    {
      id: "feature-2",
      name: "Feature Two",
      description: "Second feature",
      enabled: false,
      rollout: 0,
      category: "Beta",
    },
    {
      id: "feature-3",
      name: "Feature Three",
      description: "Third feature",
      enabled: true,
      rollout: 50,
      category: "Core",
    },
  ];

  describe("exportFeatures", () => {
    it("should export features as valid JSON", () => {
      const result = exportFeatures(mockFeatures);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should preserve all feature properties", () => {
      const exported = exportFeatures(mockFeatures);
      const parsed = JSON.parse(exported) as Feature[];

      expect(parsed).toHaveLength(mockFeatures.length);
      mockFeatures.forEach((original, index) => {
        expect(parsed[index]).toEqual(original);
      });
    });

    it("should handle empty arrays", () => {
      const result = exportFeatures([]);
      expect(JSON.parse(result)).toEqual([]);
    });

    it("should preserve rollout values", () => {
      const exported = exportFeatures(mockFeatures);
      const parsed = JSON.parse(exported) as Feature[];

      const feature50 = parsed.find((f) => f.rollout === 50);
      expect(feature50?.rollout).toBe(50);
    });
  });

  describe("importFeatures", () => {
    it("should import valid JSON", () => {
      const exported = exportFeatures(mockFeatures);
      const imported = importFeatures(exported);

      expect(imported).toEqual(mockFeatures);
    });

    it("should validate JSON structure", () => {
      const invalidJson = JSON.stringify([{ id: "test", invalid: true }]);
      expect(() => importFeatures(invalidJson)).toThrow("Invalid feature JSON format");
    });

    it("should validate rollout range", () => {
      const invalidFeature = JSON.stringify([
        {
          id: "test",
          name: "Test",
          description: "Test",
          enabled: true,
          rollout: 150, // Invalid: > 100
          category: "Test",
        },
      ]);
      expect(() => importFeatures(invalidFeature)).toThrow();
    });

    it("should reject non-array JSON", () => {
      const invalidJson = JSON.stringify({ id: "test" });
      expect(() => importFeatures(invalidJson)).toThrow();
    });

    it("should handle multiple imports", () => {
      const exported = exportFeatures(mockFeatures);
      const imported1 = importFeatures(exported);
      const imported2 = importFeatures(exported);

      expect(imported1).toEqual(imported2);
    });
  });

  describe("validateFeatureJson", () => {
    it("should validate correct feature array", () => {
      expect(validateFeatureJson(mockFeatures)).toBe(true);
    });

    it("should reject non-array", () => {
      expect(validateFeatureJson({ features: [] })).toBe(false);
    });

    it("should reject features with missing properties", () => {
      const invalid = [
        {
          id: "test",
          name: "Test",
          // Missing other properties
        },
      ];
      expect(validateFeatureJson(invalid)).toBe(false);
    });

    it("should reject invalid rollout values", () => {
      const invalid = [
        {
          id: "test",
          name: "Test",
          description: "Test",
          enabled: true,
          rollout: 150, // Invalid
          category: "Test",
        },
      ];
      expect(validateFeatureJson(invalid)).toBe(false);
    });

    it("should reject non-boolean enabled property", () => {
      const invalid = [
        {
          id: "test",
          name: "Test",
          description: "Test",
          enabled: "yes", // Should be boolean
          rollout: 100,
          category: "Test",
        },
      ];
      expect(validateFeatureJson(invalid)).toBe(false);
    });
  });

  describe("Round-trip operations", () => {
    it("should preserve data through export and import cycle", () => {
      const exported = exportFeatures(mockFeatures);
      const imported = importFeatures(exported);
      const reexported = exportFeatures(imported);

      expect(JSON.parse(reexported)).toEqual(mockFeatures);
    });

    it("should handle multiple round-trips", () => {
      let data = mockFeatures;

      for (let i = 0; i < 5; i++) {
        const exported = exportFeatures(data);
        data = importFeatures(exported);
      }

      expect(data).toEqual(mockFeatures);
    });
  });
});
