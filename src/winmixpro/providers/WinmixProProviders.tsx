import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { FeatureFlagsProvider } from "./FeatureFlagsProvider";
interface WinmixProProvidersProps {
  children: ReactNode;
}
export const WinmixProProviders = ({
  children
}: WinmixProProvidersProps) => <ThemeProvider>
    <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
  </ThemeProvider>;