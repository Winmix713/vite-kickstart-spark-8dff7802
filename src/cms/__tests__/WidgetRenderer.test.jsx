import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetRenderer } from "../runtime/WidgetRenderer";

describe("WidgetRenderer", () => {
  it("should render unknown widget fallback for non-existent widget", () => {
    render(<WidgetRenderer type="non_existent_widget" />);
    expect(screen.getByText(/Unknown Widget/i)).toBeDefined();
    expect(screen.getByText(/non_existent_widget/i)).toBeDefined();
  });

  it("should render TeamStats widget", () => {
    render(
      <WidgetRenderer
        type="team_stats"
        props={{ teamId: "bayern", season: "2024" }}
      />,
    );
    expect(screen.getByText(/Team Statistics/i)).toBeDefined();
  });

  it("should render LeagueTable widget", () => {
    render(
      <WidgetRenderer
        type="league_table"
        props={{ league: "Premier League", season: "2024" }}
      />,
    );
    expect(screen.getByText(/Premier League/i)).toBeDefined();
  });

  it("should pass props to widget component", () => {
    render(
      <WidgetRenderer
        type="team_stats"
        props={{ teamId: "real-madrid", season: "2023" }}
      />,
    );
    expect(screen.getByText(/REAL-MADRID/i)).toBeDefined();
    expect(screen.getByText(/Season 2023/i)).toBeDefined();
  });
});
