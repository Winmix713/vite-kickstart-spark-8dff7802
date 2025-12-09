# WinMix CMS - Phase 1: Widget Registry & Renderer

## Overview

This is the foundation of the WinMix CMS system, implementing a dynamic widget registry that auto-discovers and loads widget components with metadata. This system powers the Page Builder, Runtime Renderer, and AI tools.

## Architecture

### Widget Registry (`/registry/widgetRegistry.ts`)

The widget registry automatically discovers all widgets using Vite's glob import feature:

```typescript
import.meta.glob('/src/widgets/**/index.{jsx,tsx}', { eager: true })
```

**Features:**
- Auto-discovery of widgets from `/src/widgets/**/index.{jsx,tsx}`
- Type-safe widget definitions with TypeScript
- Metadata extraction from `Component.meta` property
- Helper functions for querying widgets

**API:**
```typescript
// Get all registered widgets
import { widgetRegistry } from '@cms/registry/widgetRegistry';

// Get widget by ID
import { getWidgetById } from '@cms/registry/widgetRegistry';
const widget = getWidgetById('team_stats');

// Get widgets by category
import { getWidgetsByCategory } from '@cms/registry/widgetRegistry';
const footballWidgets = getWidgetsByCategory('Football');

// Get all categories
import { getCategories } from '@cms/registry/widgetRegistry';
const categories = getCategories();
```

### Widget Renderer (`/runtime/WidgetRenderer.tsx`)

A safe, robust component for rendering widgets with error handling and loading states.

**Features:**
- Error boundary for catching widget errors
- Suspense for handling async loading
- Fallback UI for unknown widgets
- Type-safe props passing

**Usage:**
```jsx
import WidgetRenderer from '@cms/runtime/WidgetRenderer';

<WidgetRenderer 
  type="team_stats" 
  props={{ teamId: 'bayern', season: '2024' }}
/>
```

## Widget Definition Interface

```typescript
interface WidgetDefinition {
  id: string;                          // Unique widget identifier
  name: string;                        // Display name
  category: string;                    // Category for grouping
  preview?: string;                    // Optional preview image path
  defaultSize: { w: number; h: number }; // Default grid size
  props: Record<string, any>;          // Props schema
  Component: React.FC<any>;            // React component
}
```

## Creating a Widget

1. Create a directory in `/src/widgets/YourWidget/`
2. Create `index.jsx` or `index.tsx` with your component
3. Attach metadata to the component using `.meta` property

### Example Widget

```jsx
import React from 'react';
import styles from './styles.module.scss';
import Spring from '@components/Spring';

const TeamStats = ({ teamId = 'bayern', season = '2024' }) => {
  return (
    <Spring className="card card-padded h-100">
      <div className={styles.header}>
        <h3>Team Statistics</h3>
        <div>{teamId} - {season}</div>
      </div>
      {/* Widget content */}
    </Spring>
  );
};

// Attach metadata to component
TeamStats.meta = {
  id: 'team_stats',
  name: 'Team Stats',
  category: 'Football',
  defaultSize: { w: 2, h: 2 },
  props: {
    teamId: { type: 'string', default: 'bayern' },
    season: { type: 'string', default: '2024' },
  },
};

export default TeamStats;
```

## Example Widgets

### TeamStats (`/src/widgets/TeamStats/`)
- **ID:** `team_stats`
- **Category:** Football
- **Props:** `teamId`, `season`
- **Size:** 2x2
- Displays team statistics including matches, wins, draws, losses, goals

### LeagueTable (`/src/widgets/LeagueTable/`)
- **ID:** `league_table`
- **Category:** Football
- **Props:** `league`, `season`
- **Size:** 3x3
- Displays league standings with position indicators

## Testing

Tests are located in `/src/cms/__tests__/`

Run tests:
```bash
npm test
```

## Import Paths

The CMS system is available via the `@cms` alias:

```typescript
import { widgetRegistry } from '@cms/registry/widgetRegistry';
import { WidgetRenderer } from '@cms/runtime/WidgetRenderer';
import type { WidgetDefinition } from '@cms/registry/widgetRegistry';
```

## Type Safety

The system is fully typed with TypeScript:
- Widget definitions are type-safe
- Component props are validated
- Helper functions have proper return types

## Error Handling

The WidgetRenderer includes multiple layers of error handling:

1. **Unknown Widget:** Shows a yellow warning box
2. **Widget Error:** Shows a red error box with retry option
3. **Loading State:** Shows a loading message during async operations

## Future Enhancements (Phase 2+)

- Visual Page Builder UI
- Drag-and-drop widget placement
- Widget configuration editor
- AI-powered widget recommendations
- Real-time preview
- Widget marketplace
