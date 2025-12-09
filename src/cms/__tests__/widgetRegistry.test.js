import { describe, it, expect } from 'vitest';
import { widgetRegistry, getWidgetById, getWidgetsByCategory, getCategories } from '../registry/widgetRegistry';

describe('Widget Registry', () => {
  it('should have widgets registered', () => {
    expect(widgetRegistry).toBeDefined();
    expect(Array.isArray(widgetRegistry)).toBe(true);
  });

  it('should have TeamStats widget', () => {
    const teamStats = getWidgetById('team_stats');
    expect(teamStats).toBeDefined();
    expect(teamStats?.name).toBe('Team Stats');
    expect(teamStats?.category).toBe('Football');
  });

  it('should have LeagueTable widget', () => {
    const leagueTable = getWidgetById('league_table');
    expect(leagueTable).toBeDefined();
    expect(leagueTable?.name).toBe('League Table');
    expect(leagueTable?.category).toBe('Football');
  });

  it('should get widgets by category', () => {
    const footballWidgets = getWidgetsByCategory('Football');
    expect(footballWidgets.length).toBeGreaterThan(0);
    
    const teamStats = footballWidgets.find(w => w.id === 'team_stats');
    const leagueTable = footballWidgets.find(w => w.id === 'league_table');
    
    expect(teamStats).toBeDefined();
    expect(leagueTable).toBeDefined();
  });

  it('should get all categories', () => {
    const categories = getCategories();
    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toContain('Football');
  });

  it('should return undefined for unknown widget id', () => {
    const unknown = getWidgetById('non_existent_widget');
    expect(unknown).toBeUndefined();
  });

  it('widgets should have required fields', () => {
    widgetRegistry.forEach(widget => {
      expect(widget.id).toBeDefined();
      expect(widget.name).toBeDefined();
      expect(widget.category).toBeDefined();
      expect(widget.defaultSize).toBeDefined();
      expect(widget.defaultSize.w).toBeDefined();
      expect(widget.defaultSize.h).toBeDefined();
      expect(widget.props).toBeDefined();
      expect(widget.Component).toBeDefined();
      expect(typeof widget.Component).toBe('function');
    });
  });
});
