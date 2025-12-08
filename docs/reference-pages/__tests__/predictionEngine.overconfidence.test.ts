import { describe, it, expect, beforeEach } from 'vitest';
import { PredictionEngine } from '@/utils/predictionEngine';

describe('PredictionEngine - Overconfidence Blocker', () => {
  let engine: PredictionEngine;

  beforeEach(() => {
    engine = new PredictionEngine();
  });

  describe('checkOverconfidence', () => {
    it('should not block predictions with confidence <= 95%', () => {
      const historicalPredictions = [];
      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.90,
        historicalPredictions
      );

      expect(result.should_block).toBe(false);
    });

    it('should not block when no prior failures exist', () => {
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.96,
          was_correct: true,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.97,
        historicalPredictions
      );

      expect(result.should_block).toBe(false);
    });

    it('should block when high-confidence prediction with same outcome failed recently', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.96,
          was_correct: false,
          created_at: tenDaysAgo
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.97,
        historicalPredictions
      );

      expect(result.should_block).toBe(true);
      expect(result.reason).toContain('High confidence');
      expect(result.downgraded_confidence).toBeLessThanOrEqual(0.88);
      expect(result.alternate_outcome).toBeDefined();
    });

    it('should not block if failure is outside 30-day window', () => {
      const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.96,
          was_correct: false,
          created_at: thirtyTwoDaysAgo
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.97,
        historicalPredictions
      );

      expect(result.should_block).toBe(false);
    });

    it('should suggest correct alternate outcomes', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.96,
          was_correct: false,
          created_at: tenDaysAgo
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.97,
        historicalPredictions
      );

      expect(result.alternate_outcome).toBe('draw');
    });

    it('should downgrade confidence to at most 88% (or 92% of original, whichever is lower)', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const historicalPredictions = [
        {
          predicted_outcome: 'away_win',
          confidence_score: 0.96,
          was_correct: false,
          created_at: tenDaysAgo
        }
      ];

      const originalConfidence = 0.99;
      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'away_win',
        originalConfidence,
        historicalPredictions
      );

      expect(result.downgraded_confidence).toBeLessThanOrEqual(0.88);
      expect(result.downgraded_confidence).toBeLessThanOrEqual(originalConfidence * 0.92);
    });

    it('should include the prior failure date in the reason', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const historicalPredictions = [
        {
          predicted_outcome: 'draw',
          confidence_score: 0.95,
          was_correct: false,
          created_at: tenDaysAgo.toISOString()
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'draw',
        0.96,
        historicalPredictions
      );

      expect(result.should_block).toBe(true);
      expect(result.prior_failure_date).toBe(tenDaysAgo.toISOString());
    });

    it('should only consider failures with confidence >= 95%', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.93, // Below 95% threshold
          was_correct: false,
          created_at: tenDaysAgo
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.97,
        historicalPredictions
      );

      expect(result.should_block).toBe(false);
    });

    it('should handle multiple recent failures (select most recent)', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      
      const historicalPredictions = [
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.96,
          was_correct: false,
          created_at: tenDaysAgo
        },
        {
          predicted_outcome: 'home_win',
          confidence_score: 0.97,
          was_correct: false,
          created_at: fiveDaysAgo
        }
      ];

      const result = engine.checkOverconfidence(
        ['Team A', 'Team B'],
        'home_win',
        0.98,
        historicalPredictions
      );

      expect(result.should_block).toBe(true);
      expect(result.prior_failure_date).toBe(fiveDaysAgo);
    });
  });

  describe('generateExplanation', () => {
    it('should generate a valid explanation structure', () => {
      const features = {
        'recent_form': 0.35,
        'h2h_history': 0.25,
        'home_advantage': 0.20
      };

      const ensembleResult = {
        btts: {
          probability: 45,
          recommendation: 'NO' as const,
          confidence: 'MEDIUM' as const
        },
        over25: {
          probability: 55,
          recommendation: 'OVER' as const,
          confidence: 'MEDIUM' as const
        },
        confidence_score: 88
      };

      const explanation = engine.generateExplanation(features, ensembleResult);

      expect(explanation.summary).toBeDefined();
      expect(explanation.key_factors).toHaveLength(3);
      expect(explanation.decision_tree).toBeDefined();
      expect(explanation.decision_tree.length).toBeGreaterThan(0);
      expect(explanation.confidence_breakdown).toBeDefined();
      expect(explanation.confidence_breakdown.base_confidence).toBeDefined();
      expect(explanation.confidence_breakdown.pattern_boost).toBeDefined();
      expect(explanation.confidence_breakdown.final_confidence).toBeDefined();
    });

    it('should correctly label factors', () => {
      const features = {
        'recent_form': 0.35,
        'h2h_history': 0.25
      };

      const ensembleResult = {
        btts: { probability: 45, recommendation: 'NO' as const, confidence: 'MEDIUM' as const },
        over25: { probability: 55, recommendation: 'OVER' as const, confidence: 'MEDIUM' as const },
        confidence_score: 80
      };

      const explanation = engine.generateExplanation(features, ensembleResult);

      expect(explanation.key_factors[0].factor).toBe('Recent Form');
      expect(explanation.key_factors[1].factor).toBe('Head-to-Head');
    });

    it('should calculate confidence breakdown correctly', () => {
      const features = { 'recent_form': 0.3 };
      const ensembleResult = {
        btts: { probability: 50, recommendation: 'NO' as const, confidence: 'MEDIUM' as const },
        over25: { probability: 50, recommendation: 'OVER' as const, confidence: 'MEDIUM' as const },
        confidence_score: 80
      };

      const explanation = engine.generateExplanation(features, ensembleResult);

      expect(explanation.confidence_breakdown.base_confidence).toBe(0.80);
      expect(explanation.confidence_breakdown.pattern_boost).toBeGreaterThanOrEqual(0);
      expect(explanation.confidence_breakdown.pattern_boost).toBeLessThanOrEqual(0.15);
      expect(explanation.confidence_breakdown.final_confidence).toBeGreaterThan(
        explanation.confidence_breakdown.base_confidence
      );
    });
  });

  describe('buildDecisionPath', () => {
    it('should generate decision path with nodes', () => {
      const featureImportance = {
        'recent_form': 0.45,
        'h2h_history': 0.35,
        'home_advantage': 0.20
      };

      const decisionPath = engine.buildDecisionPath(featureImportance);

      expect(decisionPath.nodes).toBeDefined();
      expect(decisionPath.nodes.length).toBeGreaterThan(0);
    });

    it('should have root, branch, and leaf nodes', () => {
      const featureImportance = {
        'recent_form': 0.45,
        'h2h_history': 0.35
      };

      const decisionPath = engine.buildDecisionPath(featureImportance);

      const types = decisionPath.nodes.map(n => n.type);
      expect(types).toContain('root');
      expect(types).toContain('leaf');
    });

    it('should set outcome for decision nodes', () => {
      const featureImportance = {
        'recent_form': 0.45,
        'h2h_history': 0.35
      };

      const decisionPath = engine.buildDecisionPath(featureImportance);
      const outcomeNodes = decisionPath.nodes.filter(n => n.outcome);

      expect(outcomeNodes.length).toBeGreaterThan(0);
      expect(outcomeNodes[0].outcome).toBe('home_win');
    });

    it('should include confidence contributions', () => {
      const featureImportance = {
        'recent_form': 0.45,
        'h2h_history': 0.35
      };

      const decisionPath = engine.buildDecisionPath(featureImportance);
      const nodesWithContribution = decisionPath.nodes.filter(n => n.confidence_contribution !== undefined);

      expect(nodesWithContribution.length).toBeGreaterThan(0);
    });
  });
});
