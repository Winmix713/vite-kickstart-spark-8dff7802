---
title: "Testing Guide"
description: "Testing approach for analytics utilities and UI components"
category: "10-testing"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["testing", "vitest", "e2e", "playwright", "coverage"]
---

# Testing Guide

This document describes the testing approach for analytics utilities and UI components.

## Unit Tests (Vitest)

**Scope:**
- Pure functions under `src/lib` (e.g., transition matrix, RNG validation)
- Small UI render checks for analysis widgets

**Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for rapid iteration
npm run test:coverage # Generate coverage reports
```

**Examples:**

Transition matrix:
```ts
import { describe, it, expect } from 'vitest';
import { buildTransitionMatrix } from '@/lib/transitionMatrix';

describe('transition matrix', () => {
  it('applies Laplace smoothing', () => {
    const { matrix, counts } = buildTransitionMatrix(['H','H','D','V','V','V'] as any);
    expect(counts.length).toBe(3);
    expect(matrix[0].reduce((a,b)=>a+b,0)).toBeCloseTo(1, 5);
  });
});
```

RNG validation:
```ts
import { chiSquareTest, runsTest } from '@/lib/rngValidation';

const result = chiSquareTest([10, 10, 10], [10, 10, 10]);
// result.isRandom should be true at 95%
```

## Edge Functions (Deno)

- Use `supabase functions serve` to run locally and curl the endpoints
- Repository includes Deno tests in `supabase/functions/_shared/*test.ts`
- Add targeted integration tests for new functions

## E2E (Playwright)

- Validate integration of widgets on `TeamDetail`
- Check page renders Streak Analysis and Transition Matrix sections
- Verify graceful degradation when backend is unavailable

## Coverage

- `npm run test:coverage` generates reports under `coverage/`
- Focus coverage on pure functions first
- UI coverage can remain opportunistic

## Test Categories

### Unit Tests
- Pure functions
- Utility helpers
- Data transformations

### Integration Tests
- Edge function calls
- Database operations
- API responses

### E2E Tests
- User journeys
- Critical paths
- Cross-browser testing

## Related Documentation

- [Development Guide](../12-development/README.md)
- [Operations Runbook](../11-deployment/OPERATIONS_RUNBOOK.md)
