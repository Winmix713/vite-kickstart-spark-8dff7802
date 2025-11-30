import { useContext } from "react";
import { FeatureFlagsContext } from "@/winmixpro/providers/FeatureFlagsProvider";
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return context;
};