# Phase 9 Temporal Decay Edge Function

## Overview

This Edge Function handles temporal decay calculations for information freshness tracking in the WinMix TipsterHub platform. It provides endpoints to calculate freshness scores and refresh stale data records.

## Type Safety

This function uses explicit TypeScript types with no `any` annotations, ensuring type safety and better maintainability.

### Type Definitions

All types are defined in `types.ts`:

- **FreshnessRecord**: Database record structure
- **SupabaseClient**: Type-safe Supabase client interface
- **CreateFreshnessResult**: Result type for record creation
- **RefreshResult**: Result type for refresh operations
- **DataTypeConfig**: Configuration for different data types

## API Endpoints

### POST `/temporal/freshness`

Calculate the freshness score for a specific record.

**Request Body:**
```json
{
  "table_name": "matches",
  "record_id": "abc-123",
  "decay_rate": 0.1
}
```

**Response:**
```json
{
  "success": true,
  "freshness_score": 0.85,
  "is_stale": false
}
```

### POST `/temporal/check-stale`

Check for stale records and refresh them.

**Response:**
```json
{
  "success": true,
  "staleRecords": [...],
  "refreshedCount": 5,
  "refreshResults": [
    {
      "recordId": "abc-123",
      "tableName": "matches",
      "success": true
    }
  ]
}
```

## Data Type Configuration

The function supports different decay rates for different data types:

| Table Name | Data Type | Decay Rate | Stale Threshold (days) |
|-----------|-----------|------------|------------------------|
| matches | match | 0.05 | 3 |
| predictions | user_prediction | 0.1 | 7 |
| market_odds | odds | 0.5 | 1 |
| patterns | pattern | 0.15 | 5 |

## Freshness Calculation

The freshness score is calculated using exponential decay:

```
freshness = e^(-decay_rate * days_elapsed)
```

A record is considered stale when its freshness score drops below 0.5 (50%).

## Error Handling

All errors are properly typed and handled:

- **Validation Errors**: Return 400 with Zod error details
- **Database Errors**: Return 500 with error message
- **Not Found**: Gracefully handled with PGRST116 code check

## Development

To verify type safety:

```bash
# Check for any 'any' types
grep -n "\bany\b" index.ts types.ts

# Run ESLint
cd /home/engine/project && npm run lint

# Build the project
npm run build
```

## Related Files

- `index.ts` - Main function implementation
- `types.ts` - TypeScript type definitions
- `/supabase/migrations/20251102160000_phase_9_advanced_features.sql` - Database schema
