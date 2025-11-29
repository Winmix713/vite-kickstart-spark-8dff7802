---
title: "Analytics Features"
description: "Core analytics features including streak analysis, transition matrix, and RNG validation"
category: "08-ml-pipeline"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["analytics", "streaks", "markov", "validation", "statistics"]
---

# Analytics Features

This document summarizes the core analytics features provided by the WinMix TipsterHub frontend and Edge Functions.

## Streak Analysis

- **Purpose**: Surface short-term form signals that analysts can act on
- **Types supported**:
  - Winning Streak (overall)
  - Clean Sheet Streak (no goals conceded)
  - BTTS Streak (Both Teams To Score)
  - Home Winning Streak (current home-only sequence)
- **Backend**: Supabase Edge Function `team-streaks` (read-only)
- **Frontend**: `src/components/analysis/StreakAnalysis.tsx`

**Expected payload from `team-streaks`:**
```json
{
  "team_id": "string",
  "streaks": {
    "overall_winning": { "pattern_type": "...", "confidence": 0.8, "metadata": { "streak_length": 5 } },
    "clean_sheet": { "..." },
    "btts": { "..." },
    "home_winning": 3
  }
}
```

**Notes:**
- Confidence and strength are simple heuristics for UI prioritization
- Minimum streak length defaults to 3
- Last 10 matches are scanned

## Transition Matrix (Markov)

- **Purpose**: Estimate conditional probability of next outcome given the previous one
- **States**: H (win), D (draw), V (loss)
- **Smoothing**: Laplace (K=3) to improve stability with small samples
- **Backend**: Supabase Edge Function `team-transition-matrix`
- **Frontend**: `src/components/analysis/TransitionMatrixHeatmap.tsx`

**Sample response:**
```json
{
  "team_id": "string",
  "matrix": [[0.5, 0.3, 0.2], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]],
  "counts": [[5, 3, 2], [3, 4, 3], [2, 3, 5]],
  "sampleSize": 30,
  "confidence": "medium"
}
```

**UI:**
- 3×3 heatmap with tooltips shows P(next | previous)
- Confidence badge reflects sample size thresholds (<10, <20, >=20 transitions)

## RNG Validation (Foundations)

- **Library**: `src/lib/rngValidation.ts`
- **Functions**:
  - `chiSquareTest(observed, expected)` → { statistic, df, pValue, isRandom }
  - `runsTest(sequence)` → { zScore, isRandom, runsCount, expectedRuns }
  - `detectAnomalies(values, threshold)` → number[] indices

**Usage:**
- Intended for league- or market-level sanity checks
- Suitable for indicative analysis
- Prefer vetted statistical packages for production-grade inference

## Component Integration

Team Detail page (`src/pages/TeamDetail.tsx`) integrates:
- Team Patterns (persistent DB-backed signals)
- Streak Analysis (current sequences)
- Transition Matrix Heatmap (Markov transitions)

All widgets degrade gracefully if Edge Functions are unavailable.

## Related Documentation

- [Model Lifecycle](./MODEL_LIFECYCLE.md)
- [Ensemble Predictor](./ENSEMBLE_PREDICTOR.md)
- [Decay Alerts](./DECAY_ALERTS.md)
