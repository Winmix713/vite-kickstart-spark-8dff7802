import { describe, it, expect } from "vitest";
import { createDefaultConfig, validateFeatureFlag, validateConfig, exportConfig, importConfig, isFlagEnabled, getFlagValue, filterFlagsByCategory } from "../lib/feature-flags";
import type { FeatureFlag } from "../types";
describe("feature-flags", () => {
  describe("createDefaultConfig", () => {
    it("should create a valid default config", () => {
      const config = createDefaultConfig();
      expect(config).toHaveProperty("flags");
      expect(config).toHaveProperty("version");
      expect(config).toHaveProperty("lastUpdated");
      expect(Array.isArray(config.flags)).toBe(true);
      expect(config.flags.length).toBeGreaterThan(0);
    });
  });
  describe("validateFeatureFlag", () => {
    it("should validate a correct flag", () => {
      const flag: FeatureFlag = {
        id: "test-flag",
        name: "Test Flag",
        description: "A test flag",
        enabled: true,
        category: "feature"
      };
      const result = validateFeatureFlag(flag);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    it("should reject flag without id", () => {
      const flag = {
        name: "Test Flag",
        description: "A test flag",
        enabled: true,
        category: "feature"
      } as Partial<FeatureFlag>;
      const result = validateFeatureFlag(flag);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Flag ID is required");
    });
    it("should reject flag without name", () => {
      const flag = {
        id: "test-flag",
        description: "A test flag",
        enabled: true,
        category: "feature"
      } as Partial<FeatureFlag>;
      const result = validateFeatureFlag(flag);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Flag name is required");
    });
    it("should reject flag with invalid rollout percentage", () => {
      const flag: FeatureFlag = {
        id: "test-flag",
        name: "Test Flag",
        description: "A test flag",
        enabled: true,
        rolloutPercentage: 150,
        category: "feature"
      };
      const result = validateFeatureFlag(flag);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Rollout percentage must be between 0 and 100");
    });
    it("should reject flag with invalid category", () => {
      const flag = {
        id: "test-flag",
        name: "Test Flag",
        description: "A test flag",
        enabled: true,
        category: "invalid"
      } as Partial<FeatureFlag>;
      const result = validateFeatureFlag(flag);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid category");
    });
  });
  describe("validateConfig", () => {
    it("should validate a correct config", () => {
      const config = createDefaultConfig();
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    it("should reject config without flags array", () => {
      const config = {
        version: "1.0.0"
      } as never;
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Flags array is required");
    });
    it("should reject config with duplicate flag IDs", () => {
      const config = {
        flags: [{
          id: "duplicate-id",
          name: "Flag 1",
          description: "First flag",
          enabled: true,
          category: "feature"
        }, {
          id: "duplicate-id",
          name: "Flag 2",
          description: "Second flag",
          enabled: true,
          category: "feature"
        }],
        version: "1.0.0",
        lastUpdated: new Date().toISOString()
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Duplicate flag IDs"))).toBe(true);
    });
  });
  describe("exportConfig and importConfig", () => {
    it("should export config as JSON string", () => {
      const config = createDefaultConfig();
      const exported = exportConfig(config);
      expect(typeof exported).toBe("string");
      expect(() => JSON.parse(exported)).not.toThrow();
    });
    it("should import valid config", () => {
      const config = createDefaultConfig();
      const exported = exportConfig(config);
      const result = importConfig(exported);
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.flags).toHaveLength(config.flags.length);
    });
    it("should reject invalid JSON", () => {
      const result = importConfig("invalid-json");
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
    it("should reject invalid config structure", () => {
      const invalidConfig = JSON.stringify({
        invalid: "structure"
      });
      const result = importConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
  describe("isFlagEnabled", () => {
    it("should return true for enabled flag", () => {
      const flags: FeatureFlag[] = [{
        id: "test-flag",
        name: "Test Flag",
        description: "Test",
        enabled: true,
        category: "feature"
      }];
      expect(isFlagEnabled(flags, "test-flag")).toBe(true);
    });
    it("should return false for disabled flag", () => {
      const flags: FeatureFlag[] = [{
        id: "test-flag",
        name: "Test Flag",
        description: "Test",
        enabled: false,
        category: "feature"
      }];
      expect(isFlagEnabled(flags, "test-flag")).toBe(false);
    });
    it("should return false for non-existent flag", () => {
      const flags: FeatureFlag[] = [];
      expect(isFlagEnabled(flags, "non-existent")).toBe(false);
    });
    it("should check dependencies", () => {
      const flags: FeatureFlag[] = [{
        id: "dependency",
        name: "Dependency",
        description: "Dependency flag",
        enabled: false,
        category: "feature"
      }, {
        id: "dependent",
        name: "Dependent",
        description: "Dependent flag",
        enabled: true,
        dependencies: ["dependency"],
        category: "feature"
      }];
      expect(isFlagEnabled(flags, "dependent")).toBe(false);
    });
  });
  describe("getFlagValue", () => {
    it("should return metadata value for enabled flag", () => {
      const flags: FeatureFlag[] = [{
        id: "test-flag",
        name: "Test Flag",
        description: "Test",
        enabled: true,
        metadata: {
          testKey: "testValue"
        },
        category: "feature"
      }];
      expect(getFlagValue(flags, "test-flag", "testKey")).toBe("testValue");
    });
    it("should return undefined for disabled flag", () => {
      const flags: FeatureFlag[] = [{
        id: "test-flag",
        name: "Test Flag",
        description: "Test",
        enabled: false,
        metadata: {
          testKey: "testValue"
        },
        category: "feature"
      }];
      expect(getFlagValue(flags, "test-flag", "testKey")).toBeUndefined();
    });
    it("should return undefined for non-existent metadata key", () => {
      const flags: FeatureFlag[] = [{
        id: "test-flag",
        name: "Test Flag",
        description: "Test",
        enabled: true,
        metadata: {
          testKey: "testValue"
        },
        category: "feature"
      }];
      expect(getFlagValue(flags, "test-flag", "nonExistent")).toBeUndefined();
    });
  });
  describe("filterFlagsByCategory", () => {
    it("should filter flags by category", () => {
      const flags: FeatureFlag[] = [{
        id: "feature-1",
        name: "Feature 1",
        description: "Feature",
        enabled: true,
        category: "feature"
      }, {
        id: "experiment-1",
        name: "Experiment 1",
        description: "Experiment",
        enabled: true,
        category: "experiment"
      }, {
        id: "feature-2",
        name: "Feature 2",
        description: "Feature",
        enabled: true,
        category: "feature"
      }];
      const features = filterFlagsByCategory(flags, "feature");
      const experiments = filterFlagsByCategory(flags, "experiment");
      expect(features).toHaveLength(2);
      expect(experiments).toHaveLength(1);
      expect(features.every(f => f.category === "feature")).toBe(true);
      expect(experiments.every(f => f.category === "experiment")).toBe(true);
    });
  });
});