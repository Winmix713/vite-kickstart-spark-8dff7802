import type { FeatureFlag, FeatureFlagsConfig } from "@/winmixpro/types";
export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [{
  id: "enable-phase9-collaborative",
  name: "Phase 9 Collaborative Weights",
  description: "Engedélyezi a kollaboratív súlyozást Phase 9 blending-ben",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    owner: "Phase9Team",
    version: "3.1"
  }
}, {
  id: "enable-market-overlay",
  name: "Market Overlay",
  description: "Piaci odds összevetés valós időben",
  enabled: true,
  rolloutPercentage: 80,
  category: "feature",
  dependencies: ["enable-phase9-collaborative"],
  metadata: {
    owner: "MarketIntelligence"
  }
}, {
  id: "enable-temporal-decay",
  name: "Temporal Decay",
  description: "Időbeli leértékelés régebbi adatokra",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    owner: "MLOps",
    decayRate: 0.32
  }
}, {
  id: "enable-advanced-heatmap",
  name: "Advanced Health Heatmap",
  description: "Bővített szolgáltatás heatmap megjelenítés",
  enabled: false,
  rolloutPercentage: 25,
  category: "experiment",
  metadata: {
    experimentId: "heatmap-v2"
  }
}, {
  id: "enable-real-time-alerts",
  name: "Real-time Alerts",
  description: "Valós idejű értesítések kritikus eseményekhez",
  enabled: true,
  rolloutPercentage: 100,
  category: "operational",
  metadata: {
    channels: ["slack", "email"]
  }
}, {
  id: "enable-dark-mode-only",
  name: "Dark Mode Only",
  description: "Kényszerített sötét mód (világos mód letiltása)",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    reason: "Design consistency"
  }
}, {
  id: "enable-model-comparison",
  name: "Champion vs Challenger Comparison",
  description: "Model összehasonlító nézet champion/challenger elemzéshez",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    owner: "MLOps"
  }
}, {
  id: "enable-feedback-inbox",
  name: "Feedback Inbox",
  description: "Központosított visszajelzés kezelő inbox",
  enabled: true,
  rolloutPercentage: 90,
  category: "feature",
  metadata: {
    owner: "ProductTeam"
  }
}, {
  id: "enable-auto-refresh",
  name: "Auto Refresh Data",
  description: "Automatikus adatfrissítés a dashboardokon",
  enabled: false,
  rolloutPercentage: 0,
  category: "experiment",
  metadata: {
    intervalSeconds: 30
  }
}, {
  id: "enable-theme-customization",
  name: "Theme Customization",
  description: "Felhasználói téma testreszabás és mentés",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    owner: "DesignOps"
  }
}, {
  id: "enable-integration-sentry",
  name: "Sentry Integration",
  description: "UI hibák automatikus küldése Sentry-be",
  enabled: true,
  rolloutPercentage: 100,
  category: "operational",
  metadata: {
    environment: "production"
  }
}, {
  id: "enable-prediction-confidence",
  name: "Prediction Confidence Scores",
  description: "Predikció részletesség bizalmi score-okkal",
  enabled: true,
  rolloutPercentage: 100,
  category: "feature",
  metadata: {
    owner: "MLOps",
    minConfidence: 0.6
  }
}, {
  id: "killswitch-market-api",
  name: "Market API Killswitch",
  description: "Vészhelyzeti piaci API leállítás",
  enabled: false,
  rolloutPercentage: 0,
  category: "killswitch",
  metadata: {
    reason: "Emergency only"
  }
}];
export const createDefaultConfig = (): FeatureFlagsConfig => ({
  flags: DEFAULT_FEATURE_FLAGS,
  version: "1.0.0",
  lastUpdated: new Date().toISOString()
});
export const validateFeatureFlag = (flag: Partial<FeatureFlag>): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (!flag.id || flag.id.trim().length === 0) {
    errors.push("Flag ID is required");
  }
  if (!flag.name || flag.name.trim().length === 0) {
    errors.push("Flag name is required");
  }
  if (flag.rolloutPercentage !== undefined && (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100)) {
    errors.push("Rollout percentage must be between 0 and 100");
  }
  if (!flag.category || !["feature", "experiment", "killswitch", "operational"].includes(flag.category)) {
    errors.push("Invalid category");
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
export const validateConfig = (config: Partial<FeatureFlagsConfig>): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (!config.flags || !Array.isArray(config.flags)) {
    errors.push("Flags array is required");
    return {
      valid: false,
      errors
    };
  }
  config.flags.forEach((flag, index) => {
    const validation = validateFeatureFlag(flag);
    if (!validation.valid) {
      errors.push(`Flag at index ${index}: ${validation.errors.join(", ")}`);
    }
  });
  const ids = config.flags.map(f => f.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate flag IDs found: ${duplicateIds.join(", ")}`);
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
export const exportConfig = (config: FeatureFlagsConfig): string => JSON.stringify(config, null, 2);
export const importConfig = (jsonString: string): {
  success: boolean;
  config?: FeatureFlagsConfig;
  errors?: string[];
} => {
  try {
    const parsed = JSON.parse(jsonString) as Partial<FeatureFlagsConfig>;
    const validation = validateConfig(parsed);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    return {
      success: true,
      config: parsed as FeatureFlagsConfig
    };
  } catch (error) {
    return {
      success: false,
      errors: [`JSON parse error: ${error instanceof Error ? error.message : "Unknown error"}`]
    };
  }
};
export const isFlagEnabled = (flags: FeatureFlag[], flagId: string): boolean => {
  const flag = flags.find(f => f.id === flagId);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.dependencies) {
    return flag.dependencies.every(depId => isFlagEnabled(flags, depId));
  }
  return true;
};
export const getFlagValue = <T = unknown,>(flags: FeatureFlag[], flagId: string, metadataKey?: string): T | undefined => {
  const flag = flags.find(f => f.id === flagId);
  if (!flag || !flag.enabled) return undefined;
  if (metadataKey && flag.metadata) {
    return flag.metadata[metadataKey] as T;
  }
  return undefined;
};
export const filterFlagsByCategory = (flags: FeatureFlag[], category: FeatureFlag["category"]): FeatureFlag[] => flags.filter(f => f.category === category);