# Phase 5 Implementation: Theme Variants System

## Overview

Phase 5 introduces the WinMix CMS theming system with design tokens, theme variants, widget-level styling, and persistent per-page overrides via Redux and Supabase.

## Implemented Components

### 1. Design Tokens (`src/cms/theme/tokens.js`)

**File**: `/home/engine/project/src/cms/theme/tokens.js`

- **Core Tokens**: Color palettes, typography scales, spacing, border radius, shadows, transitions
- **Theme Variants** (4 pre-built):
  - `default` - Clean, modern design
  - `glass` - Glassmorphism with frosted glass effects
  - `emerald` - Green-themed design system
  - `dark` - High contrast dark theme
- **Widget Style Variants** (5 types):
  - `default` - Standard styling
  - `compact` - Reduced padding for space constraints
  - `minimal` - Clean, no borders/shadows
  - `outlined` - Strong border emphasis
  - `elevated` - Prominent shadows and depth
- **Utility Functions**:
  - `buildCssVariables(themeTokens, mode)` - Converts tokens to CSS variables
  - `getThemeVariant(name)` - Retrieves variant by name
  - `getThemeVariantNames()` - Lists all variant names
  - `getWidgetStyleVariant(slug)` - Retrieves widget variant
  - `getWidgetStyleVariantSlugs()` - Lists all widget variant slugs

### 2. CMS Theme Provider (`src/cms/theme/ThemeProvider.jsx`)

**File**: `/home/engine/project/src/cms/theme/ThemeProvider.jsx`

- **CmsThemeProvider** component:
  - Reads tokens and injects CSS variables to root/body
  - Manages current theme variant and light/dark mode
  - Provides widget variant state management
  - Nestable with global `ThemeProvider` (no conflicts)
- **Hooks**:
  - `useCmsTheme()` - Full access (throws if no provider)
  - `useCmsThemeSafe()` - Safe fallback for optional provider usage
- **API Methods**:
  - `toggleMode()` - Switch between light/dark
  - `changeVariant(name)` - Switch theme variant
  - `setThemeOverrides(overrides)` - Apply custom overrides
  - `setWidgetVariant(widgetInstanceId, slug)` - Set per-widget styling
  - `getWidgetVariant(widgetInstanceId)` - Retrieve widget variant

### 3. Global Theme CSS (`src/cms/theme/theme.css`)

**File**: `/home/engine/project/src/cms/theme/theme.css`

- CSS custom properties for all tokens (colors, typography, spacing, radius, shadows)
- Theme-specific overrides via `[data-cms-theme="variant"]` selectors
- Dark mode overrides via `[data-cms-mode="dark"]` selectors
- Widget variant classes (`.cms-widget-*`)
- Default values for all CSS variables

### 4. WidgetRegistry Extensions (`src/cms/registry/widgetRegistry.ts`)

**Changes**: Updated `/home/engine/project/src/cms/registry/widgetRegistry.ts`

- New `WidgetStyleVariant` interface
- Extended `WidgetDefinition` with optional `styleVariants` field
- Widget metadata can now include style variant definitions
- Example: `TeamStats` widget now includes 3 style variants

### 5. WidgetRenderer Updates (`src/cms/runtime/WidgetRenderer.tsx`)

**Changes**: Updated `/home/engine/project/src/cms/runtime/WidgetRenderer.tsx`

- Added `variant` and `instanceId` props
- Applies variant class names to rendered widgets
- Passes `data-cms-variant` and `data-cms-instance-id` attributes
- Maintains backward compatibility with existing widgets

### 6. Redux State Management (`src/features/cms/cmsPageSlice.js`)

**File**: `/home/engine/project/src/features/cms/cmsPageSlice.js`

- Redux slice managing per-page theme overrides
- **Actions**:
  - `setCurrentPage(pageId)` - Track current page
  - `initializePageOverrides(pageId, defaults)` - Setup page with defaults
  - `setPageThemeMode(pageId, mode)` - Toggle light/dark
  - `setPageThemeVariant(pageId, variant)` - Change page variant
  - `setWidgetVariant(pageId, widgetInstanceId, variant)` - Set widget variant
  - `setColorOverride(pageId, colorKey, colorValue)` - Custom color
  - `removeColorOverride(pageId, colorKey)` - Remove color override
  - `setSpacingOverride(pageId, spacingKey, spacingValue)` - Custom spacing
  - `setPageThemeOverrides(pageId, overrides)` - Merge all overrides
  - `markPageDirty(pageId)` - Track unsaved changes
  - `clearPageOverrides(pageId)` - Reset to defaults
  - `resetPageData(pageId)` - Remove page data
- **Selectors**:
  - `selectPageThemeMode(state, pageId)`
  - `selectPageThemeVariant(state, pageId)`
  - `selectWidgetVariant(state, pageId, widgetInstanceId)`
  - `selectColorOverrides(state, pageId)`
  - `selectSpacingOverrides(state, pageId)`
  - Plus loading and error selectors
- **State Structure**:
  ```javascript
  {
    currentPageId: string,
    pages: {
      [pageId]: {
        themeMode: 'light' | 'dark',
        themeVariant: string,
        widgetVariants: { [widgetInstanceId]: string },
        colorOverrides: { [colorKey]: string },
        spacingOverrides: { [spacingKey]: string },
        _isDirty: boolean
      }
    },
    loading: boolean,
    error: null | Error
  }
  ```

### 7. Props Editor Component (`src/cms/runtime/PropsEditor.jsx`)

**File**: `/home/engine/project/src/cms/runtime/PropsEditor.jsx`

- React component for editing page theme and widget variants
- **Three tabs**:
  - **Theme & Variant**: Toggle light/dark mode, select theme variant
  - **Colors**: View/manage color overrides, add custom colors
  - **Widget Variants**: Per-widget style variant selection
- Dispatches Redux actions for state management
- Color picker integration
- Widget list from registry

### 8. CMS Page Service (`src/services/cmsPageService.js`)

**File**: `/home/engine/project/src/services/cmsPageService.js`

- Supabase integration for page theme overrides
- **Functions**:
  - `savePageLayout(pageId, layoutData, themeOverrides)` - Save/update page
  - `loadPageLayout(pageId)` - Load page with overrides
  - `updatePageThemeOverrides(pageId, overrides)` - Update just overrides
  - `getAllPages()` - List all pages
  - `deletePage(pageId)` - Remove page
  - `getPageThemeOverrideAuditLog(pageId, limit)` - Audit trail
  - `mergePageThemeOverrides(pageId, partialOverrides)` - Merge updates
- Graceful fallbacks for non-existent pages
- Error handling and logging

### 9. Supabase Migration (`docs/reference-pages/supabase/migrations/20250205000000_page_theme_overrides.sql`)

**File**: `/home/engine/project/docs/reference-pages/supabase/migrations/20250205000000_page_theme_overrides.sql`

- Adds `theme_overrides JSONB` column to `pages` table
- Validation function `validate_theme_overrides()` for constraint checking
- Creates audit table `page_theme_override_audit` for change tracking
- Audit trigger `audit_theme_override_changes()` for logging
- RLS policies (admin-only access, aligned with Phase 3)
- GIN index on theme_overrides for performance
- Helper functions and grants

### 10. Integration with App

**Changes to existing files**:
- **`src/App.jsx`**: Import `@cms/theme/theme.css`
- **`tailwind.config.ts`**: Added `cms` color utilities (bg-cms-primary, text-cms-foreground, etc.)
- **`jsconfig.json`**: Added `@cms/*` and `@integrations/*` path aliases
- **`src/app/store.js`**: Integrated `cmsPageReducer` into Redux store
- **`src/widgets/TeamStats/index.jsx`**: Added example `styleVariants` metadata
- **`src/cms/index.ts`**: Exported all new theme components and utilities

### 11. Testing (`src/cms/__tests__/`)

**Test Files Created**:

1. **`tokens.test.js`** - Token utility tests
   - CSS variable generation for all modes
   - Theme variant retrieval and listing
   - Widget style variant access
   - Color property consistency
   - Theme-specific variations (glass effects, emerald colors, etc.)

2. **`cmsPageSlice.test.js`** - Redux state tests
   - Page initialization with defaults
   - Theme mode toggling
   - Variant selection
   - Widget variant management
   - Color and spacing overrides
   - Multi-page independence
   - Selector accuracy

3. **`integration.test.js`** - End-to-end integration tests
   - Complete theme selection workflow
   - Multiple widget variants on single page
   - CSS variable generation across all variants
   - Widget style variant retrieval
   - Color override persistence
   - Multi-page state isolation
   - Complete configuration building for database save

### 12. Documentation (`src/cms/theme/README.md`)

**File**: `/home/engine/project/src/cms/theme/README.md`

- Architecture overview
- Token system explanation
- Theme provider usage with code examples
- Tailwind integration (cms color utilities)
- Styled-components integration (CSS variables)
- Redux state management examples
- Database save/load workflows
- All theme and widget variants documented
- CSS variables reference
- Dark mode support explanation
- Testing guidelines
- Migration instructions
- Future enhancement ideas

## Acceptance Criteria Met

✅ **Tokens and ThemeProvider inject CSS variables**
- CSS variables applied to root/body via ThemeProvider
- Both Tailwind classes and styled-components can consume tokens
- Consistent theming inside builder and runtime renderer

✅ **Editors can change theme and variants**
- PropsEditor component provides UI for theme selection
- Page-level light/dark mode toggle
- Widget-specific variant selection per instance
- Choices persist via Redux + Supabase integration

✅ **Runtime pages honor theme_overrides**
- Service layer reads/writes overrides to Supabase
- Dark mode support with automatic color switching
- No interference with app-wide theme context
- Audit trail for override changes

✅ **WidgetRenderer responds to variant changes**
- Reads instance.variant prop
- Applies appropriate token mix/class names
- Backward compatible with existing widgets

✅ **Tests cover token utilities and variant editing**
- Token utility functions tested
- Redux reducer and selectors tested
- Integration tests show full workflow
- Examples provide clear implementation patterns

## File Summary

**Created Files** (12):
1. `src/cms/theme/tokens.js` - Design tokens and variants
2. `src/cms/theme/ThemeProvider.jsx` - Theme context provider
3. `src/cms/theme/theme.css` - Global CSS variables
4. `src/cms/theme/README.md` - Documentation
5. `src/cms/runtime/PropsEditor.jsx` - UI editor component
6. `src/cms/runtime/PropsEditor.module.scss` - Component styles
7. `src/features/cms/cmsPageSlice.js` - Redux state
8. `src/services/cmsPageService.js` - Supabase integration
9. `docs/reference-pages/supabase/migrations/20250205000000_page_theme_overrides.sql` - DB migration
10. `src/cms/__tests__/tokens.test.js` - Token tests
11. `src/cms/__tests__/cmsPageSlice.test.js` - Redux tests
12. `src/cms/__tests__/integration.test.js` - Integration tests

**Modified Files** (6):
1. `src/App.jsx` - Import theme CSS
2. `src/cms/registry/widgetRegistry.ts` - Widget variant support
3. `src/cms/runtime/WidgetRenderer.tsx` - Variant rendering
4. `tailwind.config.ts` - CMS color utilities
5. `src/app/store.js` - Add cmsPage reducer
6. `jsconfig.json` - Add @cms and @integrations aliases
7. `src/widgets/TeamStats/index.jsx` - Example variant metadata
8. `src/cms/index.ts` - Export new components

## Usage Examples

### Using Theme in a Component
```jsx
import { useCmsTheme } from '@cms/theme/ThemeProvider';

function MyComponent() {
  const { mode, currentVariant, toggleMode } = useCmsTheme();
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
    </div>
  );
}
```

### Using Tailwind CMS Colors
```jsx
<div className="bg-cms-surface text-cms-foreground border border-cms-border rounded-lg p-4">
  <button className="bg-cms-primary text-cms-primary-foreground">Click me</button>
</div>
```

### Using Styled Components with CSS Variables
```javascript
const Container = styled.div`
  background-color: var(--cms-color-background);
  color: var(--cms-color-foreground);
  border-radius: var(--cms-radius-lg);
  padding: var(--cms-spacing-4);
`;
```

### Redux State Management
```javascript
const dispatch = useDispatch();
const themeMode = useSelector(state => selectPageThemeMode(state, pageId));

dispatch(setPageThemeMode({ pageId, mode: 'dark' }));
dispatch(setPageThemeVariant({ pageId, variant: 'glass' }));
dispatch(setWidgetVariant({ pageId, widgetInstanceId: 'w-1', variant: 'compact' }));
```

### Saving/Loading from Supabase
```javascript
import { savePageLayout, loadPageLayout } from '@services/cmsPageService';

await savePageLayout(pageId, layoutData, {
  themeMode: 'dark',
  themeVariant: 'emerald',
  widgetVariants: { 'widget-1': 'compact' },
  colorOverrides: { primary: '#10b981' },
});

const page = await loadPageLayout(pageId);
console.log(page.theme_overrides);
```

## Next Steps

1. Run Supabase migration: `supabase db push`
2. Test the system with existing widgets
3. Update additional widgets with style variant metadata
4. Create builder UI that integrates PropsEditor
5. Add theme preview functionality
6. Implement theme templates and presets
7. Add A/B testing with theme variants

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│  (imports theme.css, sets up Redux, Providers)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   CmsThemeProvider  Redux Store   Supabase
        │              │              │
        ├─ tokens.js    ├─cmsPageSlice ├─pages.theme_overrides
        │               │              ├─page_theme_override_audit
        ├─theme.css     └─...          └─RLS policies
        │
        └─ useCmsTheme()
           useCmsThemeSafe()
        
        ┌──────────────────┐
        │   PropsEditor    │ ← Dispatches Redux actions
        │                  │ ← Reads Redux state
        │ - Theme toggle   │ ← Calls cmsPageService to save
        │ - Variant select │
        │ - Color picker   │
        └──────────────────┘
        
        ┌──────────────────┐
        │ WidgetRenderer   │ ← Reads variant from props
        │                  │ ← Applies CSS classes
        │ reads variant    │ ← Passes data attrs
        └──────────────────┘
```

## Notes

- All theme variables are CSS custom properties and can be used in both Tailwind and styled-components
- Dark mode is automatic - just set `data-cms-mode="dark"` on root
- Theme variants are composable - can mix tokens from different variants
- Widget variants are independent per instance
- All changes persist to Redux immediately, Supabase on explicit save
- Audit trail captures all override changes with timestamps and user info
