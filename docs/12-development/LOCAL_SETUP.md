---
title: "Local Development Setup"
description: "Guide for setting up local development environment"
category: "12-development"
language: "en"
version: "1.0.0"
last_updated: "2025-11-27"
status: "active"
tags: ["development", "local", "setup", "environment"]
---

# Local Development Setup

## Prerequisites

- Node.js 18+
- npm 8+ or bun 1+
- Git
- Supabase CLI (optional)

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd winmix-tipsterhub

# Install dependencies
npm ci

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

## Environment Variables

```bash
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key"
```

## Development Workflow

1. Start dev server: `npm run dev`
2. Make changes to files in `src/`
3. Browser auto-refreshes
4. Check console for errors
5. Run linter: `npm run lint`
6. Commit changes

## Local Supabase (Optional)

```bash
supabase start
# Update .env for local development
supabase stop
```

## Related Documentation

- [Operations Runbook](../11-deployment/OPERATIONS_RUNBOOK.md)
- [Testing Guide](../10-testing/TESTING_GUIDE.md)
