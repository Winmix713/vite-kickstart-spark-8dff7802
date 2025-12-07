---
title: "Ensemble Predictor System"
description: "Aggregating layer combining three sub-model outputs with weighted voting"
category: "08-ml-pipeline"
language: "hu"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["ml", "ensemble", "prediction", "voting", "models"]
---

# Ensemble Predictor (Együttes Előrejelző) Rendszer

## Áttekintés

Az Ensemble Predictor rendszer három al-modell kimeneteit egyesítő aggregáló réteg, amely súlyozott szavazást alkalmazva javítja a predikciós pontosságot.

## Al-modellek

### 1. Full-time Model (FT) - Súly: 0.5 (50%)
Teljes mérkőzés elemzés alapú előrejelzés:
- **Adatforrás**: Csapatok teljes forma-pontszámai (utolsó 5 mérkőzés)
- **H2H figyelembevétel**: Korábbi egymás elleni mérkőzések eredményei
- **Logika**:
  - Forma különbség normalizálása (-1 és 1 között)
  - H2H győzelmek aránya
  - Kombinált pontszám: 70% forma + 30% H2H
  - Konfidencia: 0.55 - 0.92 tartomány

### 2. Half-time Model (HT) - Súly: 0.3 (30%)
Félidős minták alapú előrejelzés:
- **Adatforrás**: Csapatok félidős teljesítménye (utolsó 5 mérkőzés)
- **Logika**:
  - Félidős gólkülönbségek átlaga csapatonként
  - Normalizált különbség (-1 és 1 között)
  - Küszöbértékek: ±0.12 (nyertes), <0.04 (döntetlen)
  - Konfidencia: 0.35 - 0.80 tartomány

### 3. Pattern Model (PT) - Súly: 0.2 (20%)
Minta-felismerés alapú előrejelzés:
- **Adatforrás**: Detektált mintázatok (győzelmi szériák, dominancia, formák)
- **Logika**:
  - Hazai előny mintázatok összesítése
  - Vendég előny mintázatok összesítése
  - Különbség >4: hazai/vendég győzelem
  - Konfidencia: 0.40 - 0.90 tartomány

## Súlyozott Szavazás

### Alapképlet
Minden kimenetelre (HOME, DRAW, AWAY):

```
Score_outcome = Σ (Model_confidence × Weight_model)
```

ahol a modell az adott kimenetelt jósolta.

### Példa Számítás

Adott:
- FT: home_win, 0.75 konfidencia
- HT: draw, 0.55 konfidencia  
- PT: home_win, 0.60 konfidencia

Pontszámok:
- HOME = (0.75 × 0.5) + (0.60 × 0.2) = 0.495
- DRAW = (0.55 × 0.3) = 0.165
- AWAY = 0.0

**Nyertes**: home_win (0.495 konfidencia)

## Konfliktus Detektálás

### Kritérium
Konfliktus jelzése, ha a két legmagasabb pontszám különbsége < 0.1 (10%)

### Kezelés
- `prediction_status`: 'uncertain' (normál esetben 'active')
- `blocked_reason`: "Ensemble konfliktus: a két legmagasabb pontszám közötti különbség X% (küszöb: 10%)."
- `alternate_outcome`: második legjobb kimenetel

## Dinamikus Újrasúlyozás

### Ha egy modell `null`
Automatikus újrasúlyozás a maradék modellek között.

**Példa**:
- FT: home_win, 0.75 ✓
- HT: null ✗
- PT: home_win, 0.70 ✓

Eredeti súlyok: FT=0.5, HT=0.3, PT=0.2
Újrasúlyozott: FT=0.714, PT=0.286

## Adatbázis Struktúra

### `ensemble_breakdown` JSONB mező

```json
{
  "weights_used": {"ft": 0.5, "ht": 0.3, "pt": 0.2},
  "votes": {
    "full_time": {"prediction": "home_win", "confidence": 0.75},
    "half_time": {"prediction": "draw", "confidence": 0.45},
    "pattern": {"prediction": "home_win", "confidence": 0.60}
  },
  "scores": {"HOME": 0.495, "DRAW": 0.135, "AWAY": 0.0},
  "winner": "home_win",
  "final_confidence": 0.495,
  "conflict_detected": false,
  "conflict_margin": 0.36
}
```

## Implementációk

### Python
```python
from ml_pipeline import EnsemblePredictor

predictor = EnsemblePredictor()
result = predictor.predict(
    full_time_prediction="home_win",
    full_time_confidence=0.75,
    half_time_prediction="draw",
    half_time_confidence=0.55,
    pattern_prediction="home_win",
    pattern_confidence=0.60
)
```

### TypeScript
```typescript
import { EnsemblePredictor } from "../_shared/ensemble.ts";

const predictor = new EnsemblePredictor();
const result = predictor.predict({
  full_time_prediction: "home_win",
  full_time_confidence: 0.75,
  half_time_prediction: "draw",
  half_time_confidence: 0.55,
  pattern_prediction: "home_win",
  pattern_confidence: 0.60
});
```

## Konfigurálás

```python
predictor = EnsemblePredictor(weights={"ft": 0.4, "ht": 0.4, "pt": 0.2})
```

```typescript
const predictor = new EnsemblePredictor({ ft: 0.4, ht: 0.4, pt: 0.2 });
```

## Related Documentation

- [Model Lifecycle](./MODEL_LIFECYCLE.md)
- [Auto Reinforcement](./AUTO_REINFORCEMENT.md)
- [Analytics Features](./ANALYTICS_FEATURES.md)
- [Rare Patterns](./RARE_PATTERNS.md)
