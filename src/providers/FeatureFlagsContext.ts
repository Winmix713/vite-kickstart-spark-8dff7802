import { createContext } from 'react';
export interface FeatureFlag {
  phase5: boolean; // Advanced pattern detection
  phase6: boolean; // Model evaluation & feedback loop  
  phase7: boolean; // Cross-league intelligence
  phase8: boolean; // Monitoring & visualization
  phase9: boolean; // Collaborative market intelligence
}
export interface FeatureFlagsContextType {
  flags: FeatureFlag;
  isEnabled: (flag: keyof FeatureFlag) => boolean;
}
export const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);
export const defaultFlags: FeatureFlag = {
  phase5: false,
  phase6: false,
  phase7: false,
  phase8: false,
  phase9: false
};