from __future__ import annotations

import unittest
from unittest.mock import patch

import prediction_engine


class PredictionEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        prediction_engine._reset_prediction_engine_state()

    def _build_valid_payload(self) -> dict[str, float]:
        payload: dict[str, float] = {}
        for index, feature in enumerate(prediction_engine._get_required_features(), start=1):
            payload[feature] = float(index)
        return payload

    def test_missing_features_raise_value_error(self) -> None:
        payload = self._build_valid_payload()
        payload.pop(next(iter(payload)))
        with self.assertRaises(ValueError) as context:
            prediction_engine.predict_scorelines(payload)
        self.assertIn("missing features", str(context.exception))

    def test_model_is_loaded_only_once(self) -> None:
        payload = self._build_valid_payload()
        call_counter = {"calls": 0}
        real_loader = prediction_engine.joblib.load

        def counting_loader(path):  # type: ignore[override]
            call_counter["calls"] += 1
            return real_loader(path)

        with patch("prediction_engine.joblib.load", side_effect=counting_loader):
            prediction_engine._reset_prediction_engine_state()
            prediction_engine.predict_scorelines(payload)
            prediction_engine.predict_scorelines(payload)

        self.assertEqual(call_counter["calls"], 1)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
