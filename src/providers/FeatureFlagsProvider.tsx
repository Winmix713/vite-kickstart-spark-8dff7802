import React, { ReactNode } from 'react';
import { phaseFlags } from '@/config/env';
import { FeatureFlagsContext, FeatureFlag, defaultFlags } from './FeatureFlagsContext';
const loadFlagsFromEnv = (): FeatureFlag => {
  return {
    phase5: phaseFlags.phase5,
    phase6: phaseFlags.phase6,
    phase7: phaseFlags.phase7,
    phase8: phaseFlags.phase8,
    phase9: phaseFlags.phase9
  };
};
interface FeatureFlagsProviderProps {
  children: ReactNode;
}
export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children
}) => {
  const flags = {
    ...defaultFlags,
    ...loadFlagsFromEnv()
  };
  const isEnabled = (flag: keyof FeatureFlag): boolean => {
    return flags[flag];
  };
  return <FeatureFlagsContext.Provider value={{
    flags,
    isEnabled
  }}>
      {children}
    </FeatureFlagsContext.Provider>;
};