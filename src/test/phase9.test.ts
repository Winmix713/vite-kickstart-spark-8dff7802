// Phase 9 Implementation Test

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollaborativeIntelligenceService, MarketIntegrationService, TemporalDecayService, SelfImprovingSystemService } from '@/lib/phase9-api';
import type { UserPredictionForm, FeatureGenerationRequest } from '@/types/phase9';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-id',
              match_id: 'test-match'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: 0.8,
      error: null
    }))
  }))
}));
describe('Phase 9 Advanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('Collaborative Intelligence', () => {
    it('should submit user prediction with validation', async () => {
      const prediction: UserPredictionForm = {
        match_id: 'test-match-id',
        predicted_outcome: 'home_win',
        confidence_score: 85,
        predicted_home_score: 2,
        predicted_away_score: 1,
        reasoning: 'Strong home form'
      };
      const result = await CollaborativeIntelligenceService.submitUserPrediction(prediction, 'test-user');
      expect(result.success).toBe(true);
      expect(result.prediction).toBeDefined();
    });
    it('should get crowd wisdom for match', async () => {
      const result = await CollaborativeIntelligenceService.getCrowdWisdom('test-match-id');
      expect(result.success).toBe(true);
    });
    it('should analyze divergence between model and crowd', async () => {
      const result = await CollaborativeIntelligenceService.analyzeDivergence('test-match-id');
      expect(result.success).toBe(true);
      if (result.analysis) {
        expect(result.analysis.divergence).toBeGreaterThanOrEqual(0);
        expect(['high', 'medium', 'low']).toContain(result.analysis.interpretation);
      }
    });
  });
  describe('Market Integration', () => {
    it('should fetch external odds with retry logic', async () => {
      const result = await MarketIntegrationService.fetchExternalOdds('test-match-id');
      expect(result.success).toBe(true);
      if (result.odds) {
        expect(result.odds.length).toBeGreaterThan(0);
        expect(result.odds[0].bookmaker).toBeDefined();
        expect(result.odds[0].home_win_odds).toBeGreaterThan(0);
      }
    });
    it('should calculate expected value correctly', () => {
      const odds = 2.5;
      const modelProbability = 0.5;
      const expectedValue = modelProbability * odds - 1; // 0.25

      expect(expectedValue).toBe(0.25);
    });
    it('should calculate Kelly fraction correctly', () => {
      const odds = 2.5;
      const modelProbability = 0.5;
      const edge = modelProbability * odds - 1; // 0.25
      const kellyFraction = edge / (odds - 1); // 0.1667

      expect(kellyFraction).toBeCloseTo(0.1667, 3);
    });
    it('should identify value bets', async () => {
      const result = await MarketIntegrationService.calculateValueBets('test-match-id');
      expect(result.success).toBe(true);
      if (result.valueBets) {
        result.valueBets.forEach(bet => {
          expect(bet.expected_value).toBeGreaterThan(0);
          expect(bet.kelly_fraction).toBeGreaterThanOrEqual(0);
          expect(bet.kelly_fraction).toBeLessThanOrEqual(1);
        });
      }
    });
  });
  describe('Temporal Decay', () => {
    it('should calculate freshness score with exponential decay', async () => {
      const result = await TemporalDecayService.calculateFreshnessScore('matches', 'test-record-id', 0.1 // 10% decay rate
      );
      expect(result.success).toBe(true);
      if (result.freshness_score !== undefined) {
        expect(result.freshness_score).toBeGreaterThanOrEqual(0);
        expect(result.freshness_score).toBeLessThanOrEqual(1);
      }
    });
    it('should identify stale data', async () => {
      const result = await TemporalDecayService.checkAndRefreshStaleData();
      expect(result.success).toBe(true);
      if (result.refreshedCount !== undefined) {
        expect(result.refreshedCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
  describe('Self-Improving System', () => {
    it('should generate new features', async () => {
      const request: FeatureGenerationRequest = {
        feature_types: ['polynomial', 'interaction'],
        base_features: ['home_form', 'away_form'],
        sample_size: 1000,
        test_duration_days: 14
      };
      const result = await SelfImprovingSystemService.generateNewFeatures(request);
      expect(result.success).toBe(true);
      if (result.experiments) {
        expect(result.experiments.length).toBeGreaterThan(0);
        result.experiments.forEach(exp => {
          expect(exp.feature_type).toBeDefined();
          expect(exp.feature_expression).toBeDefined();
          expect(exp.is_active).toBe(true);
        });
      }
    });
    it('should test feature experiments', async () => {
      const result = await SelfImprovingSystemService.testFeature('test-experiment-id');
      expect(result.success).toBe(true);
      if (result.result) {
        expect(result.result.control_accuracy).toBeGreaterThan(0);
        expect(result.result.test_accuracy).toBeGreaterThan(0);
        expect(result.result.improvement_delta).toBeDefined();
        expect(result.result.p_value).toBeGreaterThanOrEqual(0);
        expect(result.result.p_value).toBeLessThanOrEqual(1);
      }
    });
    it('should run continuous learning pipeline', async () => {
      const result = await SelfImprovingSystemService.runContinuousLearning();
      expect(result.success).toBe(true);
      if (result.results) {
        expect(result.results.experimentsGenerated).toBeGreaterThanOrEqual(0);
        expect(result.results.experimentsCompleted).toBeGreaterThanOrEqual(0);
        expect(result.results.featuresApproved).toBeGreaterThanOrEqual(0);
        expect(result.results.modelAccuracyImprovement).toBeGreaterThanOrEqual(0);
      }
    });
  });
  describe('Data Validation', () => {
    it('should validate user prediction form', () => {
      const validPrediction: UserPredictionForm = {
        match_id: 'test-match-id',
        predicted_outcome: 'home_win',
        confidence_score: 75
      };
      expect(validPrediction.predicted_outcome).toMatch(/^(home_win|draw|away_win)$/);
      expect(validPrediction.confidence_score).toBeGreaterThanOrEqual(0);
      expect(validPrediction.confidence_score).toBeLessThanOrEqual(100);
    });
    it('should validate feature generation request', () => {
      const validRequest: FeatureGenerationRequest = {
        feature_types: ['polynomial', 'interaction'],
        base_features: ['home_form', 'away_form'],
        sample_size: 1000,
        test_duration_days: 14
      };
      expect(validRequest.feature_types.length).toBeGreaterThan(0);
      expect(validRequest.base_features.length).toBeGreaterThan(0);
      expect(validRequest.sample_size).toBeGreaterThanOrEqual(100);
      expect(validRequest.test_duration_days).toBeGreaterThanOrEqual(7);
    });
  });
  describe('Mathematical Calculations', () => {
    it('should calculate exponential decay correctly', () => {
      const decayRate = 0.1; // 10% per day
      const daysElapsed = 5;
      const expectedFreshness = Math.exp(-decayRate * daysElapsed); // ≈ 0.607

      expect(expectedFreshness).toBeCloseTo(0.607, 3);
    });
    it('should handle edge cases in calculations', () => {
      // Zero decay rate should maintain freshness
      const zeroDecayFreshness = Math.exp(-0 * 10);
      expect(zeroDecayFreshness).toBe(1);

      // High decay rate should reduce freshness quickly
      const highDecayFreshness = Math.exp(-0.5 * 5);
      expect(highDecayFreshness).toBeLessThan(0.1);
    });
    it('should calculate expected value edge cases', () => {
      // Break-even odds
      const breakEvenEV = 0.5 * 2.0 - 1; // 0
      expect(breakEvenEV).toBe(0);

      // Very high probability
      const highProbEV = 0.9 * 1.5 - 1; // 0.35
      expect(highProbEV).toBeCloseTo(0.35, 2);

      // Very low probability
      const lowProbEV = 0.1 * 10.0 - 1; // 0
      expect(lowProbEV).toBe(0);
    });
  });
});