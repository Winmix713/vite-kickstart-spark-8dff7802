import { describe, it, expect } from 'vitest';
import { validateRequest, JobTriggerSchema, ModelPruneSchema, PredictionInputSchema, FeedbackInputSchema } from './validation.ts';

describe('validateRequest', () => {
  describe('JobTriggerSchema', () => {
    it('should accept valid input', () => {
      const validInput = {
        jobId: "123e4567-e89b-12d3-a456-426614174000",
        force: true,
      };

      const result = validateRequest(JobTriggerSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jobId).toBe(validInput.jobId);
        expect(result.data.force).toBe(true);
      }
    });

    it('should reject missing required field', () => {
      const invalidInput = {
        force: true,
      };

      const result = validateRequest(JobTriggerSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
        expect(Array.isArray(result.details)).toBe(true);
      }
    });

    it('should reject invalid UUID', () => {
      const invalidInput = {
        jobId: "invalid-uuid",
        force: false,
      };

      const result = validateRequest(JobTriggerSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });
  });

  describe('ModelPruneSchema', () => {
    it('should accept valid input with defaults', () => {
      const validInput = {};

      const result = validateRequest(ModelPruneSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.threshold).toBe(45);
        expect(result.data.min_sample_size).toBe(20);
      }
    });

    it('should accept valid input with custom values', () => {
      const validInput = {
        threshold: 60,
        min_sample_size: 50,
      };

      const result = validateRequest(ModelPruneSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.threshold).toBe(60);
        expect(result.data.min_sample_size).toBe(50);
      }
    });

    it('should reject invalid threshold', () => {
      const invalidInput = {
        threshold: 150, // Above 100
      };

      const result = validateRequest(ModelPruneSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });
  });

  describe('PredictionInputSchema', () => {
    it('should accept valid minimal input', () => {
      const validInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        predictedOutcome: "home_win",
        confidenceScore: 75,
      };

      const result = validateRequest(PredictionInputSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.matchId).toBe(validInput.matchId);
        expect(result.data.predictedOutcome).toBe("home_win");
        expect(result.data.confidenceScore).toBe(75);
        expect(result.data.predictionFactors).toEqual({}); // Default
      }
    });

    it('should accept valid full input', () => {
      const validInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        predictedOutcome: "away_win",
        confidenceScore: 85,
        cssScore: 82,
        predictionFactors: { form: 0.8, h2h: 0.6 },
        bttsPrediction: true,
        overUnderPrediction: 2.5,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      };

      const result = validateRequest(PredictionInputSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.matchId).toBe(validInput.matchId);
        expect(result.data.predictedOutcome).toBe("away_win");
        expect(result.data.bttsPrediction).toBe(true);
        expect(result.data.predictedHomeScore).toBe(2);
      }
    });

    it('should reject invalid outcome', () => {
      const invalidInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        predictedOutcome: "invalid_outcome",
        confidenceScore: 75,
      };

      const result = validateRequest(PredictionInputSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });

    it('should reject confidence out of range', () => {
      const invalidInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        predictedOutcome: "draw",
        confidenceScore: 150, // Above 100
      };

      const result = validateRequest(PredictionInputSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });
  });

  describe('FeedbackInputSchema', () => {
    it('should accept valid minimal input', () => {
      const validInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        homeScore: 2,
        awayScore: 1,
      };

      const result = validateRequest(FeedbackInputSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.matchId).toBe(validInput.matchId);
        expect(result.data.homeScore).toBe(2);
        expect(result.data.awayScore).toBe(1);
      }
    });

    it('should accept valid input with halftime scores', () => {
      const validInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        homeScore: 3,
        awayScore: 1,
        halfTimeHomeScore: 1,
        halfTimeAwayScore: 0,
      };

      const result = validateRequest(FeedbackInputSchema, validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.homeScore).toBe(3);
        expect(result.data.halfTimeHomeScore).toBe(1);
      }
    });

    it('should reject negative score', () => {
      const invalidInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        homeScore: -1,
        awayScore: 2,
      };

      const result = validateRequest(FeedbackInputSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });

    it('should reject missing required field', () => {
      const invalidInput = {
        matchId: "123e4567-e89b-12d3-a456-426614174000",
        homeScore: 2,
        // awayScore missing
      };

      const result = validateRequest(FeedbackInputSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-object input', () => {
      const invalidInput = "not an object";

      const result = validateRequest(JobTriggerSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });

    it('should handle null input', () => {
      const invalidInput = null;

      const result = validateRequest(JobTriggerSchema, invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid input data");
        expect(result.details).toBeDefined();
      }
    });
  });
});