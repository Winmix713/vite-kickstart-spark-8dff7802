#!/bin/bash
# Run tests in CI mode without watch mode
echo "Running tests in CI mode..."
pnpm exec vitest run --reporter=verbose
echo "Tests completed!"