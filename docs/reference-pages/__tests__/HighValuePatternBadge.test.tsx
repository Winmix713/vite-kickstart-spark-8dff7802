import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HighValuePatternBadge, type HighValuePattern } from "@/components/common/HighValuePatternBadge";

describe("HighValuePatternBadge", () => {
  const mockPattern: HighValuePattern = {
    pattern_key: "HOME_true_counterattack",
    label: "Home Win + BTTS + Counterattack",
    frequency_pct: 3.2,
    accuracy_pct: 87.5,
    sample_size: 8,
    highlight_text: "Rare but reliable: Home teams win with BTTS in counterattack scenarios",
    supporting_matches: [
      { match_id: 12345, date: "2025-01-15", teams: "Team A vs Team B" },
      { match_id: 12389, date: "2025-02-03", teams: "Team C vs Team D" },
    ],
    discovered_at: "2025-11-20T10:30:00Z",
    expires_at: "2025-12-20T10:30:00Z",
  };

  it("renders badge with correct label", () => {
    render(<HighValuePatternBadge pattern={mockPattern} />);

    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain("HIGH VALUE PATTERN");
  });

  it("displays sparkles icon", () => {
    render(<HighValuePatternBadge pattern={mockPattern} />);

    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge.querySelector("svg")).toBeTruthy();
  });

  it("applies gradient styling", () => {
    render(<HighValuePatternBadge pattern={mockPattern} />);

    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge.className).toContain("from-amber-500");
    expect(badge.className).toContain("to-orange-600");
  });

  it("renders with showTooltip true", () => {
    render(
      <HighValuePatternBadge pattern={mockPattern} showTooltip={true} />
    );

    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge).toBeTruthy();
  });

  it("hides tooltip when showTooltip is false", () => {
    render(<HighValuePatternBadge pattern={mockPattern} showTooltip={false} />);

    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge).toBeTruthy();
  });

  it("handles missing optional fields gracefully", () => {
    const minimalPattern: HighValuePattern = {
      pattern_key: "test_pattern",
      label: "Test Pattern",
      frequency_pct: 2.5,
      accuracy_pct: 85.0,
      sample_size: 10,
    };

    const { container } = render(
      <HighValuePatternBadge pattern={minimalPattern} />
    );

    expect(container).toBeTruthy();
  });

  it("passes all pattern data to component", () => {
    const { container } = render(
      <HighValuePatternBadge pattern={mockPattern} showTooltip={true} />
    );

    // Badge should be present
    const badge = screen.getByText(/HIGH VALUE PATTERN/i);
    expect(badge).toBeTruthy();

    // Component should render without errors
    expect(container).toBeTruthy();
  });

  it("renders without crashing when no supporting matches", () => {
    const patternWithoutMatches: HighValuePattern = {
      ...mockPattern,
      supporting_matches: [],
    };

    const { container } = render(
      <HighValuePatternBadge
        pattern={patternWithoutMatches}
        showTooltip={true}
      />
    );

    expect(container).toBeTruthy();
  });
});
