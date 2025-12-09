# WinMix CMS Theme System - Phase 5

## Overview

The CMS Theme System provides a comprehensive theming solution for the WinMix CMS, including:

- **Design Tokens**: Centralized source of truth for colors, typography, spacing, and other design properties
- **Theme Variants**: Pre-built theme systems (default, glass, emerald, dark) with light/dark mode support
- **Widget Style Variants**: Per-widget styling options (default, compact, minimal, outlined, elevated)
- **CSS Variable Injection**: Automatic application of theme tokens to CSS custom properties
- **Redux Integration**: Persistent storage of per-page theme overrides
- **Supabase Sync**: Save and load page theme overrides from the database

## Architecture

### Token System (`tokens.js`)

The `tokens.js` file exports:

1. **Base Tokens**: Color palettes, typography scales, spacing, border radius, shadows
2. **Theme Variants**: Different design systems (default, glass, emerald, dark)
3. **Widget Style Variants**: Visual styles for widgets
4. **Utility Functions**: Convert tokens to CSS variables, query variants

### Theme Provider (`ThemeProvider.jsx`)

The `CmsThemeProvider` component:

- Reads tokens and writes them to CSS variables on `<body>` and `:root`
- Exposes `mode`, `currentVariant`, and `setThemeOverrides` methods
- Works alongside the existing global `ThemeProvider` without conflicts
- Provides `useCmsTheme()` hook for consuming theme context

### Styling Integration

The theme system integrates with:

- **Tailwind CSS**: CMS colors available via `bg-cms-primary`, `text-cms-foreground`, etc.
- **Styled Components**: CSS variables accessible as `var(--cms-color-primary)`, etc.
- **CSS Files**: Global CSS file (`theme.css`) with default variables and theme-specific overrides

### Redux State Management

The `cmsPageSlice` manages:

- Current page theme mode (light/dark)
- Current theme variant
- Per-widget variant selections
- Color and spacing overrides
- Dirty state for tracking changes

### Database Schema

The `pages` table includes:

- `theme_overrides` (JSONB): Stores the complete theme override configuration
- `page_theme_override_audit`: Tracks all theme override changes
- RLS policies: Admin-only access (aligned with Phase 3)

## Usage

### 1. Using Theme Tokens

```javascript
import { getThemeVariant, buildCssVariables, themeVariants } from '@cms/theme/tokens';

// Get a theme variant
const defaultTheme = getThemeVariant('default');

// Build CSS variables
const cssVars = buildCssVariables(defaultTheme, 'light');

// Access variant names
const variantNames = Object.keys(themeVariants); // ['default', 'glass', 'emerald', 'dark']
```

### 2. Using the Theme Provider

```javascript
import { CmsThemeProvider, useCmsTheme } from '@cms/theme/ThemeProvider';

function App() {
  return (
    <CmsThemeProvider defaultVariant="default" defaultMode="light">
      <MyComponent />
    </CmsThemeProvider>
  );
}

function MyComponent() {
  const { mode, currentVariant, toggleMode, changeVariant } = useCmsTheme();
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <p>Current variant: {currentVariant}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
      <select onChange={(e) => changeVariant(e.target.value)}>
        <option value="default">Default</option>
        <option value="glass">Glass</option>
        <option value="emerald">Emerald</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

### 3. Using Tailwind Classes

```jsx
// Using CMS theme colors via Tailwind
<div className="bg-cms-surface text-cms-foreground border border-cms-border rounded-lg p-4">
  <button className="bg-cms-primary text-cms-primary-foreground hover:opacity-90">
    Click me
  </button>
</div>
```

### 4. Using Styled Components

```javascript
import styled from 'styled-components';

const Container = styled.div`
  background-color: var(--cms-color-background);
  color: var(--cms-color-foreground);
  border: 1px solid var(--cms-color-border);
  border-radius: var(--cms-radius-lg);
  padding: var(--cms-spacing-4);
`;

const Button = styled.button`
  background-color: var(--cms-color-primary);
  color: var(--cms-color-primary-foreground);
  padding: var(--cms-spacing-2) var(--cms-spacing-4);
  border-radius: var(--cms-radius-md);
  
  &:hover {
    opacity: 0.9;
  }
`;
```

### 5. Managing Page Theme Overrides

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  setPageThemeMode,
  setPageThemeVariant,
  setWidgetVariant,
  selectPageThemeMode,
  selectPageThemeVariant,
  selectWidgetVariant,
} from '@features/cms/cmsPageSlice';

function PageEditor({ pageId }) {
  const dispatch = useDispatch();
  const themeMode = useSelector(state => selectPageThemeMode(state, pageId));
  const variant = useSelector(state => selectPageThemeVariant(state, pageId));

  const handleModeChange = (newMode) => {
    dispatch(setPageThemeMode({ pageId, mode: newMode }));
  };

  const handleVariantChange = (newVariant) => {
    dispatch(setPageThemeVariant({ pageId, variant: newVariant }));
  };

  const handleWidgetVariant = (widgetInstanceId, variantSlug) => {
    dispatch(setWidgetVariant({ pageId, widgetInstanceId, variant: variantSlug }));
  };

  return (
    <div>
      <select value={themeMode} onChange={(e) => handleModeChange(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      
      <select value={variant} onChange={(e) => handleVariantChange(e.target.value)}>
        <option value="default">Default</option>
        <option value="glass">Glass</option>
        <option value="emerald">Emerald</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

### 6. Saving/Loading from Database

```javascript
import { savePageLayout, loadPageLayout, updatePageThemeOverrides } from '@services/cmsPageService';

// Save page layout with theme overrides
await savePageLayout(pageId, layoutData, {
  themeMode: 'dark',
  themeVariant: 'emerald',
  widgetVariants: {
    'widget-1': 'compact',
    'widget-2': 'minimal',
  },
  colorOverrides: {
    primary: '#10b981',
  },
});

// Load page layout
const page = await loadPageLayout(pageId);
console.log(page.theme_overrides);

// Update just the theme overrides
await updatePageThemeOverrides(pageId, {
  themeMode: 'light',
});
```

### 7. Using the Props Editor

```javascript
import PropsEditor from '@cms/runtime/PropsEditor';

function PageBuilder({ pageId }) {
  const handleSave = async () => {
    // Save the page with current overrides
    const state = store.getState();
    const overrides = state.cmsPage.pages[pageId];
    await updatePageThemeOverrides(pageId, overrides);
  };

  return (
    <div>
      <PropsEditor pageId={pageId} onSave={handleSave} />
      {/* Rest of page builder UI */}
    </div>
  );
}
```

## Theme Variants

### Default Theme
- Clean, modern design
- Blue primary colors
- Full color palette with semantic colors
- Light and dark modes supported

### Glass Theme
- Glassmorphism effects with frosted glass
- Transparent backgrounds with blur effects
- Rounded corners and specialized shadows
- Modern, trendy aesthetic

### Emerald Theme
- Green-focused color scheme
- Emerald primary and secondary colors
- Nature-inspired palette
- Light and dark variations

### Dark Theme
- High contrast dark mode
- Optimized for low-light viewing
- Bright accent colors for readability
- WCAG accessibility compliant

## Widget Style Variants

### Default
- Standard padding and spacing
- Normal borders and shadows
- General purpose styling

### Compact
- Reduced padding and spacing
- Ideal for information-dense layouts
- Smaller visual footprint

### Minimal
- No borders or shadows
- Clean, minimalist appearance
- Focuses content over chrome

### Outlined
- Strong border emphasis
- Clear definition and separation
- Good for visual hierarchy

### Elevated
- Prominent shadows and depth
- Card-like appearance
- Emphasizes importance

## CSS Variables Reference

### Colors
```css
--cms-color-background
--cms-color-foreground
--cms-color-surface
--cms-color-border
--cms-color-muted
--cms-color-primary
--cms-color-primary-foreground
--cms-color-secondary
--cms-color-secondary-foreground
--cms-color-accent
--cms-color-success
--cms-color-warning
--cms-color-error
--cms-color-info
```

### Typography
```css
--cms-font-family-sans
--cms-font-family-serif
--cms-font-family-mono

--cms-font-size-xs through --cms-font-size-4xl
--cms-font-weight-thin through --cms-font-weight-black
```

### Spacing
```css
--cms-spacing-0 through --cms-spacing-24
```

### Radius
```css
--cms-radius-none
--cms-radius-sm
--cms-radius-base
--cms-radius-md
--cms-radius-lg
--cms-radius-xl
--cms-radius-2xl
--cms-radius-3xl
--cms-radius-full
```

### Shadows
```css
--cms-shadow-none
--cms-shadow-sm
--cms-shadow-base
--cms-shadow-md
--cms-shadow-lg
--cms-shadow-xl
```

## Testing

Run tests:
```bash
npm test src/cms/__tests__
```

Test coverage includes:

- Token utility functions (`tokens.test.js`)
  - CSS variable building
  - Variant retrieval
  - Color consistency

- Redux reducer and selectors (`cmsPageSlice.test.js`)
  - Page override actions
  - Widget variant selection
  - Color and spacing overrides
  - Selector accuracy

## Migration

The system includes a Supabase migration (`20250205000000_page_theme_overrides.sql`) that:

1. Adds `theme_overrides` JSONB column to `pages` table
2. Creates validation functions for theme override structure
3. Sets up audit logging for override changes
4. Configures RLS policies (admin-only)

Run migrations:
```bash
supabase db push
```

## Dark Mode Support

The theme system automatically supports dark mode:

1. Set `data-cms-mode="dark"` on the root element
2. CSS variables automatically switch to dark color palette
3. All components using `var(--cms-color-*)` will adapt
4. No additional code needed in components

## Future Enhancements

- Color picker UI for more intuitive color overrides
- Theme inheritance and cascading
- Custom font family selection
- Animation and transition customization
- Theme preview before saving
- Theme templates and presets
- A/B testing with theme variants
