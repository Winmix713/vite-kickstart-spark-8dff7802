import { createContext } from "react";
import type { FeatureFlag, FeatureFlagsConfig } from "@/winmixpro/types";
export interface FeatureFlagsContextValue {
  flags: FeatureFlag[];
  config: FeatureFlagsConfig;
  isEnabled: (flagId: string) => boolean;
  getValue: <T = unknown>(flagId: string, metadataKey?: string) => T | undefined;
  toggleFlag: (flagId: string) => void;
  updateFlag: (flagId: string, updates: Partial<FeatureFlag>) => void;
  exportFlags: () => string;
  importFlags: (jsonString: string) => {
    success: boolean;
    errors?: string[];
  };
  resetFlags: () => void;
  getByCategory: (category: FeatureFlag["category"]) => FeatureFlag[];
}
export const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);