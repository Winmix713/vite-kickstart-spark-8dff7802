"""Unit tests for EnsemblePredictor."""

import pytest
from ml_pipeline.ensemble_predictor import EnsemblePredictor


class TestEnsemblePredictor:
    """Test suite for EnsemblePredictor class."""
    
    def test_initialization_default_weights(self):
        """Test predictor initializes with default weights."""
        predictor = EnsemblePredictor()
        config = predictor.get_config()
        assert config["ft"] == 0.5
        assert config["ht"] == 0.3
        assert config["pt"] == 0.2
    
    def test_initialization_custom_weights(self):
        """Test predictor initializes with custom weights."""
        custom_weights = {"ft": 0.6, "ht": 0.25, "pt": 0.15}
        predictor = EnsemblePredictor(weights=custom_weights)
        config = predictor.get_config()
        assert config["ft"] == 0.6
        assert config["ht"] == 0.25
        assert config["pt"] == 0.15
    
    def test_predict_all_models_same_outcome(self):
        """Test prediction when all models agree."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="home_win",
            full_time_confidence=0.75,
            half_time_prediction="home_win",
            half_time_confidence=0.70,
            pattern_prediction="home_win",
            pattern_confidence=0.65
        )
        
        assert result["winner"] == "home_win"
        assert result["conflict_detected"] is False
        assert 0 < result["final_confidence"] <= 1
        assert len(result["votes"]) == 3
    
    def test_predict_models_disagree(self):
        """Test prediction when models disagree."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="home_win",
            full_time_confidence=0.60,
            half_time_prediction="draw",
            half_time_confidence=0.55,
            pattern_prediction="away_win",
            pattern_confidence=0.50
        )
        
        # FT has highest weight (0.5), so home_win should win
        assert result["winner"] == "home_win"
        assert result["conflict_detected"] is True  # Scores should be close
        assert len(result["votes"]) == 3
    
    def test_predict_conflict_detection(self):
        """Test conflict detection when top 2 scores are close."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="home_win",
            full_time_confidence=0.52,
            half_time_prediction="draw",
            half_time_confidence=0.51,
            pattern_prediction="draw",
            pattern_confidence=0.50
        )
        
        # Close confidences should trigger conflict
        assert result["conflict_detected"] is True
        assert result["conflict_margin"] < 0.1
    
    def test_predict_null_model_reweighting(self):
        """Test dynamic reweighting when one model is null."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="home_win",
            full_time_confidence=0.75,
            half_time_prediction=None,  # Missing model
            half_time_confidence=None,
            pattern_prediction="home_win",
            pattern_confidence=0.70
        )
        
        # Only FT and PT should be in votes
        assert len(result["votes"]) == 2
        assert "full_time" in result["votes"]
        assert "pattern" in result["votes"]
        assert "half_time" not in result["votes"]
        
        # Weights should be renormalized: FT 0.5/(0.5+0.2)=0.714, PT 0.2/0.7=0.286
        assert abs(result["weights_used"]["ft"] - 0.714) < 0.01
        assert abs(result["weights_used"]["pt"] - 0.286) < 0.01
        assert result["weights_used"]["ht"] == 0.0
        
        assert result["winner"] == "home_win"
    
    def test_predict_only_one_model(self):
        """Test prediction with only one model active."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="away_win",
            full_time_confidence=0.80,
            half_time_prediction=None,
            half_time_confidence=None,
            pattern_prediction=None,
            pattern_confidence=None
        )
        
        assert len(result["votes"]) == 1
        assert result["winner"] == "away_win"
        assert result["weights_used"]["ft"] == 1.0  # Fully reweighted
        assert result["final_confidence"] == 0.80
    
    def test_predict_no_models_raises_error(self):
        """Test that providing no models raises an error."""
        predictor = EnsemblePredictor()
        with pytest.raises(ValueError, match="At least one sub-model"):
            predictor.predict(
                full_time_prediction=None,
                full_time_confidence=None,
                half_time_prediction=None,
                half_time_confidence=None,
                pattern_prediction=None,
                pattern_confidence=None
            )
    
    def test_predict_invalid_confidence_raises_error(self):
        """Test that invalid confidence values raise an error."""
        predictor = EnsemblePredictor()
        with pytest.raises(ValueError, match="confidence must be in range"):
            predictor.predict(
                full_time_prediction="home_win",
                full_time_confidence=1.5,  # Invalid: > 1
                half_time_prediction=None,
                half_time_confidence=None,
                pattern_prediction=None,
                pattern_confidence=None
            )
    
    def test_predict_invalid_outcome_raises_error(self):
        """Test that invalid outcomes raise an error."""
        predictor = EnsemblePredictor()
        with pytest.raises(ValueError, match="Invalid outcome"):
            predictor.predict(
                full_time_prediction="invalid_outcome",
                full_time_confidence=0.75,
                half_time_prediction=None,
                half_time_confidence=None,
                pattern_prediction=None,
                pattern_confidence=None
            )
    
    def test_outcome_normalization(self):
        """Test that outcomes are normalized correctly."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="HOME",
            full_time_confidence=0.70,
            half_time_prediction="home_win",
            half_time_confidence=0.65,
            pattern_prediction="Home_Win",
            pattern_confidence=0.60
        )
        
        # All should be normalized to "home_win" in output
        assert result["winner"] == "home_win"
    
    def test_update_config(self):
        """Test updating weights configuration."""
        predictor = EnsemblePredictor()
        new_weights = {"ft": 0.4, "ht": 0.4, "pt": 0.2}
        predictor.update_config(new_weights)
        
        config = predictor.get_config()
        assert config["ft"] == 0.4
        assert config["ht"] == 0.4
        assert config["pt"] == 0.2
    
    def test_update_config_invalid_weights_rollback(self):
        """Test that invalid weight updates are rolled back."""
        predictor = EnsemblePredictor()
        original_config = predictor.get_config()
        
        with pytest.raises(ValueError):
            predictor.update_config({"ft": -0.5, "ht": 0.5, "pt": 0.5})
        
        # Config should be unchanged
        assert predictor.get_config() == original_config
    
    def test_scores_calculation(self):
        """Test that scores are calculated correctly."""
        predictor = EnsemblePredictor()
        result = predictor.predict(
            full_time_prediction="home_win",
            full_time_confidence=0.80,
            half_time_prediction="draw",
            half_time_confidence=0.70,
            pattern_prediction="home_win",
            pattern_confidence=0.60
        )
        
        # Expected scores:
        # HOME = 0.80 * 0.5 + 0.60 * 0.2 = 0.40 + 0.12 = 0.52
        # DRAW = 0.70 * 0.3 = 0.21
        # AWAY = 0
        expected_home = 0.80 * 0.5 + 0.60 * 0.2
        expected_draw = 0.70 * 0.3
        
        assert abs(result["scores"]["HOME"] - expected_home) < 0.01
        assert abs(result["scores"]["DRAW"] - expected_draw) < 0.01
        assert result["scores"]["AWAY"] == 0.0
    
    def test_deterministic_output(self):
        """Test that same inputs produce same outputs."""
        predictor = EnsemblePredictor()
        
        inputs = {
            "full_time_prediction": "home_win",
            "full_time_confidence": 0.75,
            "half_time_prediction": "draw",
            "half_time_confidence": 0.65,
            "pattern_prediction": "home_win",
            "pattern_confidence": 0.55
        }
        
        result1 = predictor.predict(**inputs)
        result2 = predictor.predict(**inputs)
        
        assert result1["winner"] == result2["winner"]
        assert result1["final_confidence"] == result2["final_confidence"]
        assert result1["scores"] == result2["scores"]
        assert result1["conflict_detected"] == result2["conflict_detected"]
