# WinmixPro Design System Integration Guide

This guide explains how to integrate the premium WinmixPro design system into your pages and components.

## What's New

### 1. Tailwind Configuration (tailwind.config.ts)
- Added `src/winmixpro/**/*.{ts,tsx}` to content glob
- Added custom colors: Zinc, Emerald, Violet palettes
- Added custom shadows: `glass`, `glass-lg`, `glow-emerald`, `glow-violet`
- Added backdrop blur utilities: `xl` (20px), `2xl` (40px)
- Added `shimmer` keyframes and animations
- Background color: `winmix-dark` (#050505)

### 2. Global Styles (src/index.css)
- Imported Inter font from Google Fonts
- Updated CSS variables for premium dark theme (#050505)
- Added scrollbar styling
- Added transition timing defaults (fast/base/slow)
- Added utility classes:
  - `.glass-panel` / `.glass-panel-hover` - Premium glass cards
  - `.grid-3-6-3` - Responsive 3-6-3 grid layout
  - `.layout-grid` - Responsive 12-column grid
  - `.shimmer` - Shimmer animation effect
  - `.text-gradient-emerald` / `.text-gradient-violet` - Gradient text
  - `.glow-emerald` / `.glow-violet` / `.glow-orange` - Glow effects
  - `.glass-card` - Card component
  - `.metric-pill` - Stat badge
  - `.section-title` - Section header
  - `.transition-fast/base/slow` - Transition timing

### 3. New Components (src/winmixpro/)

#### Layout Components
- **AdminLayout**: Main shell with header, sidebar, mobile drawer
- **Header**: Sticky header with logo and user menu
- **Sidebar**: Navigation with 15 admin destinations (Hungarian labels)
- **MobileMenu**: Mobile navigation drawer
- **LayoutGrid**: Responsive grid wrapper with variants

#### UI Components
- **GlassCard**: Premium glass-morphism card
- **MetricPill**: Stat badge component
- **SectionTitle**: Gradient section headers
- **GridCell**: Responsive grid cells with span variants
- **StatCard**: Stat display card with trend indicator

## Quick Start

### Using AdminLayout in Your Page

```tsx
import { AdminLayout, SectionTitle, LayoutGrid, GridCell, StatCard } from '@/winmixpro';
import { BarChart3 } from 'lucide-react';

export function MyPage() {
  return (
    <AdminLayout userEmail="user@example.com">
      <div className="space-y-8">
        <SectionTitle
          title="My Dashboard"
          subtitle="Overview of key metrics"
          icon={<BarChart3 />}
        />
        
        <LayoutGrid variant="3-6-3" className="gap-6">
          {/* Sidebar */}
          <div>{/* Left content */}</div>
          
          {/* Main */}
          <StatCard
            title="Total Users"
            value="1,234"
            change={{ value: 12, direction: 'up' }}
          />
          
          {/* Right */}
          <div>{/* Right content */}</div>
        </LayoutGrid>
      </div>
    </AdminLayout>
  );
}
```

### Using Components with Existing AdminLayout

If you already have pages using the existing `AdminLayout` from `components/admin`, you can still use WinmixPro UI components:

```tsx
import AdminLayout from "@/components/admin/AdminLayout";
import { GlassCard, MetricPill, SectionTitle } from "@/winmixpro";

export function MyPage() {
  return (
    <AdminLayout
      title="My Page"
      breadcrumbs={[{ label: "Admin", href: "/admin" }]}
    >
      <SectionTitle title="Section Title" />
      <GlassCard className="p-6">
        {/* Content */}
      </GlassCard>
    </AdminLayout>
  );
}
```

## Grid Layouts

### 3-6-3 Layout (Recommended for Dashboards)
Perfect for displaying a sidebar, main content, and right panel.

```tsx
<LayoutGrid variant="3-6-3" className="gap-6">
  <GridCell span="left">
    {/* Sidebar - 3 columns on desktop */}
  </GridCell>
  
  <GridCell span="center">
    {/* Main content - 6 columns on desktop */}
  </GridCell>
  
  <GridCell span="right">
    {/* Right panel - 3 columns on desktop */}
  </GridCell>
</LayoutGrid>
```

### Full 12-Column Grid
For flexible layouts with custom column spans.

```tsx
<LayoutGrid variant="full" className="gap-6">
  <GridCell span="half">
    {/* 50% width on desktop */}
  </GridCell>
  
  <GridCell span="full">
    {/* Full width */}
  </GridCell>
  
  <GridCell span="half">
    {/* 50% width on desktop */}
  </GridCell>
</LayoutGrid>
```

### Sidebar Layout
Optimized for pages with a fixed sidebar.

```tsx
<LayoutGrid variant="sidebar" className="gap-6">
  {/* Content with sidebar support */}
</LayoutGrid>
```

## Component Examples

### GlassCard
```tsx
<GlassCard interactive glow="emerald">
  <h3 className="text-lg font-bold text-white">Interactive Card</h3>
  <p className="text-white/60">Hover for effects</p>
</GlassCard>
```

### MetricPill
```tsx
<MetricPill
  label="Active Users"
  value="1,234"
  icon={<Users className="w-4 h-4" />}
  variant="emerald"
  size="md"
/>
```

### SectionTitle
```tsx
<SectionTitle
  title="Dashboard Overview"
  subtitle="Key metrics and trends"
  icon={<BarChart3 className="w-6 h-6" />}
  align="left"
/>
```

### StatCard
```tsx
<StatCard
  title="Total Predictions"
  value="45,291"
  icon={<TrendingUp className="w-5 h-5" />}
  change={{ value: 12, direction: 'up' }}
/>
```

## CSS Utilities

### Glass Morphism
```tsx
<div className="glass-panel p-6">
  {/* Glass panel with blur and border */}
</div>

<div className="glass-panel-hover">
  {/* Glass panel with hover effects */}
</div>
```

### Gradients
```tsx
<h1 className="text-gradient-emerald">Emerald Gradient Text</h1>
<h1 className="text-gradient-violet">Violet Gradient Text</h1>
```

### Glow Effects
```tsx
<div className="glow-emerald">Emerald glow</div>
<div className="glow-violet">Violet glow</div>
```

### Responsive Text
```tsx
<p className="text-sm-responsive">Responsive small text</p>
<p className="text-base-responsive">Responsive base text</p>
<p className="text-lg-responsive">Responsive large text</p>
```

### Transitions
```tsx
<div className="transition-fast hover:bg-white/10">Fast (150ms)</div>
<div className="transition-base hover:bg-white/10">Base (200ms)</div>
<div className="transition-slow hover:bg-white/10">Slow (300ms)</div>
```

### Shimmer Effect
```tsx
<div className="shimmer p-4">
  <p>Shimmering content</p>
</div>
```

## Navigation Structure

The Sidebar includes 15 admin destinations with Hungarian labels:

1. Dashboard (Szétlátás) - `/admin`
2. Users (Felhasználók) - `/admin/users`
3. Jobs (Feladatok) - `/admin/jobs`
4. Health (Egészség) - `/admin/health`
5. Monitoring (Megfigyelés) - `/admin/monitoring`
6. Analytics (Elemzés) - `/admin/analytics`
7. Models (Modellek) - `/admin/model-status`
8. Statistics (Statisztika) - `/admin/stats`
9. Integrations (Integrációk) - `/admin/integrations`
10. Phase 9 (Szakasz 9) - `/admin/phase9`
11. Matches (Mérkőzések) - `/admin/matches`
12. Predictions (Előrejelzések) - `/admin/predictions`
13. Feedback (Visszajelzés) - `/admin/feedback`
14. Environment (Környezet) - `/admin/environment`
15. Settings (Beállítások) - `/settings`

## Responsive Behavior

### Mobile (< 768px)
- 1-column layout
- Mobile menu drawer (hamburger icon)
- Sidebar hidden
- Full-width content

### Tablet (768px - 1024px)
- 12-column grid
- Sidebar visible (280px width)
- Content area responsive

### Desktop (>= 1024px)
- 12-column grid with 3-6-3 support
- Sidebar visible (320px width)
- Optimized spacing and typography

## Color Palette

### Primary Colors
- **Dark Background**: #050505
- **Emerald**: #22c55e (Primary actions, success)
- **Violet**: #a855f7 (Secondary actions, accents)
- **Zinc**: #111827 - #1f2937 (Neutral tones)
- **White/Translucent**: rgba(255,255,255,0.05-0.2) (Glass effects)

### Semantic Colors
- Destructive/Error: #ef4444 (Red)
- Warning: #f59e0b (Amber)
- Success: #22c55e (Emerald)
- Info: #3b82f6 (Blue)

## Performance Considerations

- Components are fully tree-shakeable
- CSS utilities only included in final build
- GPU-accelerated blur and animations
- Smooth 200ms transitions by default
- Optimized for 60fps on mobile and desktop

## Accessibility

- WCAG AA color contrast compliance
- Proper semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Mobile menu closes with Escape key

## Demo

To see all components in action, import the demo page:

```tsx
import { WinmixProDemoPage } from '@/winmixpro/DemoPage';

// Use in your routes
<Route path="/demo" element={<WinmixProDemoPage />} />
```

## Migration from Existing Components

If migrating existing pages to use WinmixPro:

1. Replace page layout wrapper with `AdminLayout`
2. Replace card components with `GlassCard`
3. Replace stat displays with `StatCard`
4. Replace section headers with `SectionTitle`
5. Use `LayoutGrid` + `GridCell` for responsive layouts
6. Update colors to use emerald/violet palette
7. Test responsive behavior on mobile/tablet/desktop

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Custom color themes
- [ ] Animation preferences (respects prefers-reduced-motion)
- [ ] Right-to-left (RTL) language support
- [ ] Additional admin destinations
- [ ] Component variants and sizes
- [ ] Storybook documentation

## Support

For issues or questions:
1. Check the components in `src/winmixpro/components/`
2. Review the README in `src/winmixpro/README.md`
3. Check Tailwind config in `tailwind.config.ts`
4. Review CSS utilities in `src/index.css`
