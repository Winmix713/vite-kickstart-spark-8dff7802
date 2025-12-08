from __future__ import annotations

from typing import Iterable, List, Sequence


class BaselineScorelineModel:
    """Small deterministic model used to exercise the prediction engine."""

    def __init__(self) -> None:
        self.classes_: List[str] = [
            "0-0",
            "1-0",
            "0-1",
            "2-1",
            "1-2",
            "2-0",
            "0-2",
            "Other",
        ]

    def _score(self, vector: Sequence[float], class_index: int) -> float:
        weight = (class_index + 1) * 0.17
        rotational = vector[class_index % len(vector)] * 0.03
        magnitude = sum(abs(value) for value in vector) + 1.0
        return abs(weight + rotational + (magnitude * 0.01 * (class_index + 1)))

    def predict_proba(self, rows: Iterable[Sequence[float]]) -> List[List[float]]:
        probabilities: List[List[float]] = []
        for row in rows:
            safe_vector = [float(value) for value in row]
            class_scores = [self._score(safe_vector, idx) for idx, _ in enumerate(self.classes_)]
            total = sum(class_scores)
            if total == 0:
                normalized = [1.0 / len(class_scores)] * len(class_scores)
            else:
                normalized = [score / total for score in class_scores]
            probabilities.append(normalized)
        return probabilities

    def predict(self, rows: Iterable[Sequence[float]]) -> List[str]:
        results: List[str] = []
        for probabilities in self.predict_proba(rows):
            max_index = max(range(len(probabilities)), key=probabilities.__getitem__)
            results.append(self.classes_[max_index])
        return results
