import { useFeatureFlags } from '@/providers/useFeatureFlags';
export const usePhaseFlags = () => {
  const {
    isEnabled
  } = useFeatureFlags();
  return {
    isPhase5Enabled: isEnabled('phase5'),
    // Advanced pattern detection
    isPhase6Enabled: isEnabled('phase6'),
    // Model evaluation & feedback loop
    isPhase7Enabled: isEnabled('phase7'),
    // Cross-league intelligence
    isPhase8Enabled: isEnabled('phase8'),
    // Monitoring & visualization
    isPhase9Enabled: isEnabled('phase9') // Collaborative market intelligence
  };
};
export default usePhaseFlags;