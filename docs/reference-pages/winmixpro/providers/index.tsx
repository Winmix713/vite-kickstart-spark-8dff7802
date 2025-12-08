import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { FeatureFlagsProvider } from "./FeatureFlagsProvider";

export { ThemeProvider, FeatureFlagsProvider };
export { useTheme } from "@/winmixpro/hooks/useTheme";
export { useFeatureFlags } from "@/winmixpro/hooks/useFeatureFlags";

interface WinmixProProvidersProps {
  children: ReactNode;
}

export const WinmixProProviders = ({ children }: WinmixProProvidersProps) => (
  <ThemeProvider>
    <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
  </ThemeProvider>
);
