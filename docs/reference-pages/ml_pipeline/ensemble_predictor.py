"""Ensemble Predictor for combining multiple sub-model predictions.

This module implements a weighted voting system that aggregates predictions
from three sub-models:
- Full-time Model (FT): Primary model with highest weight
- Half-time Model (HT): Intermediate predictions
- Pattern-based Model (PT): Pattern recognition model

Key features:
- Configurable weights (default: FT=0.5, HT=0.3, PT=0.2)
- Dynamic re-weighting when sub-models return null
- Conflict detection when top 2 outcomes have similar scores
- Deterministic output for reproducibility
"""

from typing import Dict, Optional, Tuple, List
import logging

logger = logging.getLogger(__name__)


class EnsemblePredictor:
    """Ensemble predictor implementing weighted voting logic."""
    
    # Default configuration weights
    DEFAULT_WEIGHTS = {
        "ft": 0.5,  # Full-time model
        "ht": 0.3,  # Half-time model
        "pt": 0.2,  # Pattern model
    }
    
    # Conflict threshold: if top 2 scores differ by less than this, flag as conflict
    CONFLICT_THRESHOLD = 0.1
    
    # Valid outcomes
    VALID_OUTCOMES = {"HOME", "DRAW", "AWAY", "home_win", "draw", "away_win"}
    
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """Initialize ensemble predictor with optional custom weights.
        
        Args:
            weights: Optional dict with keys 'ft', 'ht', 'pt' for model weights.
                    If not provided, uses DEFAULT_WEIGHTS.
        """
        self.weights = weights if weights else self.DEFAULT_WEIGHTS.copy()
        self._validate_weights()
    
    def _validate_weights(self) -> None:
        """Validate that weights are positive and sum close to 1.0."""
        required_keys = {"ft", "ht", "pt"}
        if not all(key in self.weights for key in required_keys):
            raise ValueError(f"Weights must contain keys: {required_keys}")
        
        if any(w < 0 for w in self.weights.values()):
            raise ValueError("All weights must be non-negative")
        
        total = sum(self.weights.values())
        if not (0.99 <= total <= 1.01):
            logger.warning(f"Weights sum to {total}, not 1.0. Will normalize during prediction.")
    
    def _normalize_outcome(self, outcome: str) -> str:
        """Normalize outcome to standard format (HOME, DRAW, AWAY)."""
        outcome_upper = outcome.upper()
        if outcome_upper in {"HOME", "HOME_WIN"}:
            return "HOME"
        elif outcome_upper == "DRAW":
            return "DRAW"
        elif outcome_upper in {"AWAY", "AWAY_WIN"}:
            return "AWAY"
        else:
            raise ValueError(f"Invalid outcome: {outcome}")
    
    def _normalize_outcome_for_output(self, outcome: str) -> str:
        """Normalize outcome to database format (home_win, draw, away_win)."""
        if outcome == "HOME":
            return "home_win"
        elif outcome == "DRAW":
            return "draw"
        elif outcome == "AWAY":
            return "away_win"
        return outcome
    
    def predict(
        self,
        full_time_prediction: Optional[str] = None,
        full_time_confidence: Optional[float] = None,
        half_time_prediction: Optional[str] = None,
        half_time_confidence: Optional[float] = None,
        pattern_prediction: Optional[str] = None,
        pattern_confidence: Optional[float] = None,
    ) -> Dict:
        """Calculate ensemble prediction from sub-model predictions.
        
        Args:
            full_time_prediction: FT model's predicted outcome (HOME/DRAW/AWAY or home_win/draw/away_win)
            full_time_confidence: FT model's confidence (0-1 range)
            half_time_prediction: HT model's predicted outcome
            half_time_confidence: HT model's confidence (0-1 range)
            pattern_prediction: PT model's predicted outcome
            pattern_confidence: PT model's confidence (0-1 range)
        
        Returns:
            Dict containing:
                - weights_used: Normalized weights used for each model
                - votes: Individual model predictions and confidences
                - scores: Aggregated scores for each outcome (HOME, DRAW, AWAY)
                - winner: Winning outcome
                - final_confidence: Confidence score of winning outcome
                - conflict_detected: Boolean indicating if top 2 outcomes are close
                - conflict_margin: Difference between top 2 scores
        
        Raises:
            ValueError: If all models return None or invalid inputs
        """
        # Collect valid models
        models = []
        if full_time_prediction is not None and full_time_confidence is not None:
            models.append(("full_time", full_time_prediction, full_time_confidence, "ft"))
        if half_time_prediction is not None and half_time_confidence is not None:
            models.append(("half_time", half_time_prediction, half_time_confidence, "ht"))
        if pattern_prediction is not None and pattern_confidence is not None:
            models.append(("pattern", pattern_prediction, pattern_confidence, "pt"))
        
        if not models:
            raise ValueError("At least one sub-model prediction must be provided")
        
        # Calculate total weight of active models
        total_weight = sum(self.weights[weight_key] for _, _, _, weight_key in models)
        
        if total_weight == 0:
            raise ValueError("Total weight of active models is zero")
        
        # Normalize weights for active models only
        normalized_weights = {}
        for _, _, _, weight_key in models:
            normalized_weights[weight_key] = self.weights[weight_key] / total_weight
        
        # Initialize scores for each outcome
        scores = {"HOME": 0.0, "DRAW": 0.0, "AWAY": 0.0}
        
        # Aggregate scores using weighted voting
        votes = {}
        for model_name, prediction, confidence, weight_key in models:
            # Validate confidence is in range
            if not (0.0 <= confidence <= 1.0):
                raise ValueError(f"{model_name} confidence must be in range [0, 1], got {confidence}")
            
            # Normalize outcome
            normalized_outcome = self._normalize_outcome(prediction)
            
            # Add weighted contribution to outcome score
            weight = normalized_weights[weight_key]
            scores[normalized_outcome] += confidence * weight
            
            # Record vote
            votes[model_name] = {
                "prediction": prediction,
                "confidence": confidence
            }
        
        # Determine winner (outcome with highest score)
        winner_outcome = max(scores.items(), key=lambda x: x[1])
        winner = winner_outcome[0]
        final_confidence = winner_outcome[1]
        
        # Check for conflict
        sorted_scores = sorted(scores.values(), reverse=True)
        conflict_margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else sorted_scores[0]
        conflict_detected = conflict_margin < self.CONFLICT_THRESHOLD
        
        # Build complete weights_used dict (including zeros for inactive models)
        weights_used = {
            "ft": normalized_weights.get("ft", 0.0),
            "ht": normalized_weights.get("ht", 0.0),
            "pt": normalized_weights.get("pt", 0.0)
        }
        
        # Build result
        result = {
            "weights_used": weights_used,
            "votes": votes,
            "scores": scores,
            "winner": self._normalize_outcome_for_output(winner),
            "final_confidence": round(final_confidence, 4),
            "conflict_detected": conflict_detected,
            "conflict_margin": round(conflict_margin, 4)
        }
        
        logger.info(
            f"Ensemble prediction: {result['winner']} "
            f"(confidence: {result['final_confidence']}, "
            f"conflict: {conflict_detected})"
        )
        
        return result
    
    def get_config(self) -> Dict[str, float]:
        """Get current weight configuration.
        
        Returns:
            Dict with model weights
        """
        return self.weights.copy()
    
    def update_config(self, new_weights: Dict[str, float]) -> None:
        """Update weight configuration.
        
        Args:
            new_weights: New weights dict with keys 'ft', 'ht', 'pt'
        
        Raises:
            ValueError: If weights are invalid
        """
        old_weights = self.weights.copy()
        self.weights = new_weights.copy()
        try:
            self._validate_weights()
            logger.info(f"Updated weights from {old_weights} to {new_weights}")
        except ValueError as e:
            self.weights = old_weights
            raise ValueError(f"Invalid weights: {e}")


def create_ensemble_predictor(weights: Optional[Dict[str, float]] = None) -> EnsemblePredictor:
    """Factory function to create an EnsemblePredictor instance.
    
    Args:
        weights: Optional custom weights dict
    
    Returns:
        EnsemblePredictor instance
    """
    return EnsemblePredictor(weights=weights)
