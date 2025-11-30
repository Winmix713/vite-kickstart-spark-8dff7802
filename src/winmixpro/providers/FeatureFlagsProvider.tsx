import { useCallback, type ReactNode } from "react";
import { useLocalStorage } from "@/winmixpro/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/winmixpro/lib/constants";
import { createDefaultConfig, exportConfig, filterFlagsByCategory, getFlagValue, importConfig, isFlagEnabled, validateConfig } from "@/winmixpro/lib/feature-flags";
import type { FeatureFlag, FeatureFlagsConfig } from "@/winmixpro/types";
import { FeatureFlagsContext, FeatureFlagsContextValue } from "./FeatureFlagsContext";
export { FeatureFlagsContext };
interface FeatureFlagsProviderProps {
  children: ReactNode;
}
export const FeatureFlagsProvider = ({
  children
}: FeatureFlagsProviderProps) => {
  const [config, setConfig] = useLocalStorage<FeatureFlagsConfig>(STORAGE_KEYS.FEATURE_FLAGS, createDefaultConfig());
  const isEnabled = useCallback((flagId: string) => isFlagEnabled(config.flags, flagId), [config.flags]);
  const getValue = useCallback(<T = unknown,>(flagId: string, metadataKey?: string) => getFlagValue<T>(config.flags, flagId, metadataKey), [config.flags]);
  const toggleFlag = useCallback((flagId: string) => {
    setConfig(prev => ({
      ...prev,
      flags: prev.flags.map(flag => flag.id === flagId ? {
        ...flag,
        enabled: !flag.enabled
      } : flag),
      lastUpdated: new Date().toISOString()
    }));
  }, [setConfig]);
  const updateFlag = useCallback((flagId: string, updates: Partial<FeatureFlag>) => {
    setConfig(prev => ({
      ...prev,
      flags: prev.flags.map(flag => flag.id === flagId ? {
        ...flag,
        ...updates
      } : flag),
      lastUpdated: new Date().toISOString()
    }));
  }, [setConfig]);
  const exportFlags = useCallback(() => exportConfig(config), [config]);
  const importFlagsCallback = useCallback((jsonString: string) => {
    const result = importConfig(jsonString);
    if (result.success && result.config) {
      const validation = validateConfig(result.config);
      if (validation.valid) {
        setConfig(result.config);
        return {
          success: true
        };
      }
      return {
        success: false,
        errors: validation.errors
      };
    }
    return result;
  }, [setConfig]);
  const resetFlags = useCallback(() => {
    setConfig(createDefaultConfig());
  }, [setConfig]);
  const getByCategory = useCallback((category: FeatureFlag["category"]) => filterFlagsByCategory(config.flags, category), [config.flags]);
  const value: FeatureFlagsContextValue = {
    flags: config.flags,
    config,
    isEnabled,
    getValue,
    toggleFlag,
    updateFlag,
    exportFlags,
    importFlags: importFlagsCallback,
    resetFlags,
    getByCategory
  };
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};