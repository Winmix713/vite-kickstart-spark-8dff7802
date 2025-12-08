#!/bin/bash
# Run tests in CI mode without watch mode
echo "Running tests in CI mode..."
timeout 60 pnpm exec vitest run --no-watch --reporter=verbose 2>&1
echo "Tests completed!"