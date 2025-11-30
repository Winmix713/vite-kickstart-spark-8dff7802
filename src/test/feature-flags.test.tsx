import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagsProvider } from '@/providers/FeatureFlagsProvider';
import { useFeatureFlags } from '@/providers/useFeatureFlags';
import { usePhaseFlags } from '@/hooks/usePhaseFlags';

// Test component to access hooks
const TestComponent = () => {
  const flags = useFeatureFlags();
  const phaseFlags = usePhaseFlags();
  return <div>
      <div data-testid="phase5">{flags.isEnabled('phase5').toString()}</div>
      <div data-testid="phase6">{flags.isEnabled('phase6').toString()}</div>
      <div data-testid="phase7">{flags.isEnabled('phase7').toString()}</div>
      <div data-testid="phase8">{flags.isEnabled('phase8').toString()}</div>
      <div data-testid="phase9">{flags.isEnabled('phase9').toString()}</div>
      
      <div data-testid="phase5-hook">{phaseFlags.isPhase5Enabled.toString()}</div>
      <div data-testid="phase9-hook">{phaseFlags.isPhase9Enabled.toString()}</div>
    </div>;
};
describe('FeatureFlags', () => {
  beforeEach(() => {
    // Reset environment variables
    delete import.meta.env.VITE_FEATURE_PHASE5;
    delete import.meta.env.VITE_FEATURE_PHASE6;
    delete import.meta.env.VITE_FEATURE_PHASE7;
    delete import.meta.env.VITE_FEATURE_PHASE8;
    delete import.meta.env.VITE_FEATURE_PHASE9;
  });
  it('should default all features to disabled', () => {
    render(<FeatureFlagsProvider>
        <TestComponent />
      </FeatureFlagsProvider>);
    expect(screen.getByTestId('phase5')).toHaveTextContent('false');
    expect(screen.getByTestId('phase6')).toHaveTextContent('false');
    expect(screen.getByTestId('phase7')).toHaveTextContent('false');
    expect(screen.getByTestId('phase8')).toHaveTextContent('false');
    expect(screen.getByTestId('phase9')).toHaveTextContent('false');
    expect(screen.getByTestId('phase5-hook')).toHaveTextContent('false');
    expect(screen.getByTestId('phase9-hook')).toHaveTextContent('false');
  });
  it('should enable specific features when env vars are set to true', () => {
    // Set environment variables
    import.meta.env.VITE_FEATURE_PHASE5 = 'true';
    import.meta.env.VITE_FEATURE_PHASE9 = 'true';
    render(<FeatureFlagsProvider>
        <TestComponent />
      </FeatureFlagsProvider>);
    expect(screen.getByTestId('phase5')).toHaveTextContent('true');
    expect(screen.getByTestId('phase6')).toHaveTextContent('false');
    expect(screen.getByTestId('phase7')).toHaveTextContent('false');
    expect(screen.getByTestId('phase8')).toHaveTextContent('false');
    expect(screen.getByTestId('phase9')).toHaveTextContent('true');
    expect(screen.getByTestId('phase5-hook')).toHaveTextContent('true');
    expect(screen.getByTestId('phase9-hook')).toHaveTextContent('true');
  });
  it('should handle invalid env var values gracefully', () => {
    import.meta.env.VITE_FEATURE_PHASE5 = 'invalid';
    import.meta.env.VITE_FEATURE_PHASE9 = 'random';
    render(<FeatureFlagsProvider>
        <TestComponent />
      </FeatureFlagsProvider>);
    expect(screen.getByTestId('phase5')).toHaveTextContent('false');
    expect(screen.getByTestId('phase9')).toHaveTextContent('false');
  });
  it('should throw error when useFeatureFlags is used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useFeatureFlags must be used within a FeatureFlagsProvider');
  });
});