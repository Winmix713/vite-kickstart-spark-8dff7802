/**
 * Unit tests for EnsemblePredictor (TypeScript implementation)
 */

import { describe, it, expect } from 'vitest';
import { EnsemblePredictor } from '@/utils/ensemblePredictor';

describe('EnsemblePredictor', () => {
  it('should initialize with default weights', () => {
    const predictor = new EnsemblePredictor();
    const config = predictor.getConfig();
    
    expect(config.ft).toBe(0.5);
    expect(config.ht).toBe(0.3);
    expect(config.pt).toBe(0.2);
  });
  
  it('should initialize with custom weights', () => {
    const customWeights = { ft: 0.6, ht: 0.25, pt: 0.15 };
    const predictor = new EnsemblePredictor(customWeights);
    const config = predictor.getConfig();
    
    expect(config.ft).toBe(0.6);
    expect(config.ht).toBe(0.25);
    expect(config.pt).toBe(0.15);
  });
  
  it('should predict correctly when all models agree', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'home_win',
      full_time_confidence: 0.75,
      half_time_prediction: 'home_win',
      half_time_confidence: 0.70,
      pattern_prediction: 'home_win',
      pattern_confidence: 0.65
    });
    
    expect(result.winner).toBe('home_win');
    expect(result.conflict_detected).toBe(false);
    expect(result.final_confidence).toBeGreaterThan(0);
    expect(result.final_confidence).toBeLessThanOrEqual(1);
    expect(Object.keys(result.votes)).toHaveLength(3);
  });
  
  it('should predict correctly when models disagree', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'home_win',
      full_time_confidence: 0.60,
      half_time_prediction: 'draw',
      half_time_confidence: 0.55,
      pattern_prediction: 'away_win',
      pattern_confidence: 0.50
    });
    
    // FT has highest weight (0.5), so home_win should win
    // Scores: HOME = 0.6*0.5 = 0.3, DRAW = 0.55*0.3 = 0.165, AWAY = 0.5*0.2 = 0.1
    // Margin = 0.3 - 0.165 = 0.135 which is > 0.1, so no conflict
    expect(result.winner).toBe('home_win');
    expect(result.conflict_detected).toBe(false);  // Scores have sufficient margin
    expect(Object.keys(result.votes)).toHaveLength(3);
  });
  
  it('should detect conflicts when top 2 scores are close', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'home_win',
      full_time_confidence: 0.52,
      half_time_prediction: 'draw',
      half_time_confidence: 0.51,
      pattern_prediction: 'draw',
      pattern_confidence: 0.50
    });
    
    expect(result.conflict_detected).toBe(true);
    expect(result.conflict_margin).toBeLessThan(0.1);
  });
  
  it('should handle null models with dynamic reweighting', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'home_win',
      full_time_confidence: 0.75,
      half_time_prediction: null,
      half_time_confidence: null,
      pattern_prediction: 'home_win',
      pattern_confidence: 0.70
    });
    
    // Only FT and PT should be in votes
    expect(Object.keys(result.votes)).toHaveLength(2);
    expect(result.votes.full_time).toBeDefined();
    expect(result.votes.pattern).toBeDefined();
    expect(result.votes.half_time).toBeUndefined();
    
    // Weights should be renormalized: FT 0.5/(0.5+0.2)≈0.714, PT 0.2/0.7≈0.286
    expect(result.weights_used.ft).toBeCloseTo(0.714, 2);
    expect(result.weights_used.pt).toBeCloseTo(0.286, 2);
    expect(result.weights_used.ht).toBe(0);
    
    expect(result.winner).toBe('home_win');
  });
  
  it('should work with only one model active', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'away_win',
      full_time_confidence: 0.80,
      half_time_prediction: null,
      half_time_confidence: null,
      pattern_prediction: null,
      pattern_confidence: null
    });
    
    expect(Object.keys(result.votes)).toHaveLength(1);
    expect(result.winner).toBe('away_win');
    expect(result.weights_used.ft).toBe(1.0);  // Fully reweighted
    expect(result.final_confidence).toBe(0.80);
  });
  
  it('should throw error when no models provided', () => {
    const predictor = new EnsemblePredictor();
    
    expect(() => {
      predictor.predict({
        full_time_prediction: null,
        full_time_confidence: null,
        half_time_prediction: null,
        half_time_confidence: null,
        pattern_prediction: null,
        pattern_confidence: null
      });
    }).toThrow('At least one sub-model');
  });
  
  it('should throw error for invalid confidence values', () => {
    const predictor = new EnsemblePredictor();
    
    expect(() => {
      predictor.predict({
        full_time_prediction: 'home_win',
        full_time_confidence: 1.5,  // Invalid: > 1
        half_time_prediction: null,
        half_time_confidence: null,
        pattern_prediction: null,
        pattern_confidence: null
      });
    }).toThrow('confidence must be in range');
  });
  
  it('should throw error for invalid outcomes', () => {
    const predictor = new EnsemblePredictor();
    
    expect(() => {
      predictor.predict({
        full_time_prediction: 'invalid_outcome',
        full_time_confidence: 0.75,
        half_time_prediction: null,
        half_time_confidence: null,
        pattern_prediction: null,
        pattern_confidence: null
      });
    }).toThrow('Invalid outcome');
  });
  
  it('should normalize outcomes correctly', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'HOME',
      full_time_confidence: 0.70,
      half_time_prediction: 'home_win',
      half_time_confidence: 0.65,
      pattern_prediction: 'Home_Win',
      pattern_confidence: 0.60
    });
    
    // All should be normalized to "home_win" in output
    expect(result.winner).toBe('home_win');
  });
  
  it('should update config correctly', () => {
    const predictor = new EnsemblePredictor();
    const newWeights = { ft: 0.4, ht: 0.4, pt: 0.2 };
    predictor.updateConfig(newWeights);
    
    const config = predictor.getConfig();
    expect(config.ft).toBe(0.4);
    expect(config.ht).toBe(0.4);
    expect(config.pt).toBe(0.2);
  });
  
  it('should rollback config on invalid weight update', () => {
    const predictor = new EnsemblePredictor();
    const originalConfig = predictor.getConfig();
    
    expect(() => {
      predictor.updateConfig({ ft: -0.5, ht: 0.5, pt: 0.5 });
    }).toThrow();
    
    // Config should be unchanged
    const config = predictor.getConfig();
    expect(config).toEqual(originalConfig);
  });
  
  it('should calculate scores correctly', () => {
    const predictor = new EnsemblePredictor();
    const result = predictor.predict({
      full_time_prediction: 'home_win',
      full_time_confidence: 0.80,
      half_time_prediction: 'draw',
      half_time_confidence: 0.70,
      pattern_prediction: 'home_win',
      pattern_confidence: 0.60
    });
    
    // Expected scores:
    // HOME = 0.80 * 0.5 + 0.60 * 0.2 = 0.40 + 0.12 = 0.52
    // DRAW = 0.70 * 0.3 = 0.21
    // AWAY = 0
    const expectedHome = 0.80 * 0.5 + 0.60 * 0.2;
    const expectedDraw = 0.70 * 0.3;
    
    expect(result.scores.HOME).toBeCloseTo(expectedHome, 2);
    expect(result.scores.DRAW).toBeCloseTo(expectedDraw, 2);
    expect(result.scores.AWAY).toBe(0.0);
  });
  
  it('should produce deterministic output', () => {
    const predictor = new EnsemblePredictor();
    
    const inputs = {
      full_time_prediction: 'home_win' as const,
      full_time_confidence: 0.75,
      half_time_prediction: 'draw' as const,
      half_time_confidence: 0.65,
      pattern_prediction: 'home_win' as const,
      pattern_confidence: 0.55
    };
    
    const result1 = predictor.predict(inputs);
    const result2 = predictor.predict(inputs);
    
    expect(result1.winner).toBe(result2.winner);
    expect(result1.final_confidence).toBe(result2.final_confidence);
    expect(result1.scores).toEqual(result2.scores);
    expect(result1.conflict_detected).toBe(result2.conflict_detected);
  });
});
