import React, { createContext, useContext, ReactNode } from 'react';

interface FeatureFlag {
  phase5: boolean;    // Advanced pattern detection
  phase6: boolean;    // Model evaluation & feedback loop  
  phase7: boolean;    // Cross-league intelligence
  phase8: boolean;    // Monitoring & visualization
  phase9: boolean;    // Collaborative market intelligence
}

interface FeatureFlagsContextType {
  flags: FeatureFlag;
  isEnabled: (flag: keyof FeatureFlag) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

const defaultFlags: FeatureFlag = {
  phase5: false,
  phase6: false,
  phase7: false,
  phase8: false,
  phase9: false,
};

const loadFlagsFromEnv = (): FeatureFlag => {
  return {
    phase5: import.meta.env.VITE_FEATURE_PHASE5 === 'true',
    phase6: import.meta.env.VITE_FEATURE_PHASE6 === 'true',
    phase7: import.meta.env.VITE_FEATURE_PHASE7 === 'true',
    phase8: import.meta.env.VITE_FEATURE_PHASE8 === 'true',
    phase9: import.meta.env.VITE_FEATURE_PHASE9 === 'true',
  };
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const flags = { ...defaultFlags, ...loadFlagsFromEnv() };

  const isEnabled = (flag: keyof FeatureFlag): boolean => {
    return flags[flag];
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

export type { FeatureFlag };