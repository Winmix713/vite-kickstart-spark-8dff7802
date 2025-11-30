# WinmixPro Design System

Premium glass-morphism design system with responsive 12-column grid layout for WinmixPro admin interfaces.

## Overview

WinmixPro provides a complete, reusable design system built on:

- **Premium Aesthetics**: Dark theme (#050505) with emerald/violet accents
- **Glass Morphism**: Backdrop blur + gradient overlays throughout
- **Responsive Grid**: 1-column mobile, 12-column tablet, 3-6-3 desktop layout
- **Hungarian Localization**: Navigation labels in Hungarian (HU)
- **Accessibility**: WCAG-compliant components with proper ARIA labels

## Architecture

```
src/winmixpro/
├── components/
│   ├── layout/          # Layout primitives
│   │   ├── AdminLayout.tsx    # Main layout shell
│   │   ├── Header.tsx         # Premium header with user menu
│   │   ├── Sidebar.tsx        # Responsive sidebar (15 admin destinations)
│   │   ├── MobileMenu.tsx     # Mobile drawer navigation
│   │   └── LayoutGrid.tsx     # Responsive grid wrapper
│   └── ui/              # Reusable UI atoms
│       ├── GlassCard.tsx      # Premium glass card component
│       ├── MetricPill.tsx     # Stat badge component
│       ├── SectionTitle.tsx   # Gradient section headers
│       ├── GridCell.tsx       # Responsive grid cells
│       └── StatCard.tsx       # Stat display card
├── WinmixProApp.tsx     # App wrapper component
├── DemoPage.tsx         # Demo/showcase page
└── index.ts            # Public exports
```

## Grid Layouts

### Responsive Breakpoints

- **Mobile** (`< md`): 1 column
- **Tablet** (`md-lg`): 12 columns (full width)
- **Desktop** (`>= lg`): 12 columns with specific span variants

### Grid Variants

#### Full Grid (12 columns)
```tsx
<LayoutGrid variant="full">
  <GridCell span="half">Content</GridCell>
  <GridCell span="half">Content</GridCell>
</LayoutGrid>
```

#### 3-6-3 Layout (Perfect for Dashboards)
```tsx
<LayoutGrid variant="3-6-3">
  <GlassCard>Left Sidebar (3 cols)</GlassCard>
  <GlassCard>Main Content (6 cols)</GlassCard>
  <GlassCard>Right Panel (3 cols)</GlassCard>
</LayoutGrid>
```

#### Sidebar Layout
```tsx
<LayoutGrid variant="sidebar">
  {/* Grid with sidebar support */}
</LayoutGrid>
```

## Components

### Layout Components

#### AdminLayout
Main layout shell that wraps all admin pages.

```tsx
<AdminLayout userEmail="user@example.com" onLogout={() => {}}>
  {/* Your content here */}
</AdminLayout>
```

Props:
- `userEmail?: string` - User email for header display
- `onLogout?: () => void` - Logout callback
- `className?: string` - Additional CSS classes

**Features:**
- Sticky header with user menu
- Responsive sidebar with Hungarian labels
- Mobile drawer navigation
- Glassmorphic design throughout

#### Header
Premium header with logo and user menu.

```tsx
<Header 
  userEmail="user@example.com"
  onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
  onLogout={() => {}}
/>
```

#### Sidebar
Navigation sidebar with 15 admin destinations and Hungarian labels.

```tsx
<Sidebar isCollapsed={false} onCollapse={(collapsed) => {}} />
```

Navigation items (with Hungarian labels):
- Dashboard (Szétlátás)
- Users (Felhasználók)
- Jobs (Feladatok)
- Health (Egészség)
- Monitoring (Megfigyelés)
- Analytics (Elemzés)
- Models (Modellek)
- Statistics (Statisztika)
- Integrations (Integrációk)
- Phase 9 (Szakasz 9)
- Matches (Mérkőzések)
- Predictions (Előrejelzések)
- Feedback (Visszajelzés)
- Environment (Környezet)
- Settings (Beállítások)

#### MobileMenu
Mobile-only navigation drawer.

```tsx
<MobileMenu isOpen={true} onClose={() => setOpen(false)} />
```

#### LayoutGrid
Responsive grid wrapper with multiple variants.

```tsx
<LayoutGrid variant="3-6-3" className="gap-6">
  {/* Grid items */}
</LayoutGrid>
```

### UI Components

#### GlassCard
Premium glass-morphism card component.

```tsx
<GlassCard interactive glow="emerald" onClick={() => {}}>
  {/* Card content */}
</GlassCard>
```

Props:
- `interactive?: boolean` - Enable hover effects
- `glow?: 'emerald' | 'violet' | 'none'` - Glow effect color
- `onClick?: () => void` - Click handler

#### MetricPill
Compact stat badge component.

```tsx
<MetricPill
  label="Active Users"
  value="1,234"
  icon={<Users className="w-4 h-4" />}
  variant="emerald"
  size="md"
/>
```

Props:
- `label: string` - Label text
- `value: string | number` - Metric value
- `icon?: React.ReactNode` - Icon element
- `variant?: 'emerald' | 'violet' | 'neutral'` - Color variant
- `size?: 'sm' | 'md' | 'lg'` - Component size

#### SectionTitle
Gradient section header component.

```tsx
<SectionTitle
  title="Dashboard Overview"
  subtitle="System health and performance metrics"
  icon={<BarChart3 className="w-6 h-6" />}
  align="left"
/>
```

Props:
- `title: string` - Section title
- `subtitle?: string` - Optional subtitle
- `icon?: React.ReactNode` - Optional icon
- `align?: 'left' | 'center' | 'right'` - Text alignment

#### GridCell
Responsive grid cell with built-in span variants.

```tsx
<GridCell span="half">
  {/* Takes 50% on desktop, 100% on mobile */}
</GridCell>
```

Props:
- `span?: 'left' | 'center' | 'right' | 'full' | 'half'` - Column span
- `className?: string` - Additional CSS classes

#### StatCard
Premium stat display card.

```tsx
<StatCard
  title="Total Predictions"
  value="45,291"
  icon={<TrendingUp className="w-5 h-5" />}
  change={{ value: 12, direction: 'up' }}
/>
```

Props:
- `title: string` - Stat title
- `value: string | number` - Stat value
- `icon?: React.ReactNode` - Icon element
- `change?: { value: number; direction: 'up' | 'down' }` - Optional trend

## CSS Utilities

### Glass Morphism
```css
.glass-panel {
  @apply bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg;
}

.glass-card {
  @apply bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg;
}
```

### Gradients
```css
.text-gradient-emerald {
  @apply bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent;
}

.text-gradient-violet {
  @apply bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600 bg-clip-text text-transparent;
}
```

### Glow Effects
```css
.glow-emerald {
  box-shadow: 0 0 60px rgba(34, 197, 94, 0.3);
}

.glow-violet {
  box-shadow: 0 0 60px rgba(168, 85, 247, 0.3);
}
```

### Responsive Text
```css
.text-sm-responsive   /* text-xs md:text-sm */
.text-base-responsive /* text-sm md:text-base */
.text-lg-responsive   /* text-base md:text-lg */
```

### Transitions
```css
.transition-fast  /* 150ms cubic-bezier(0.4, 0, 0.2, 1) */
.transition-base  /* 200ms cubic-bezier(0.4, 0, 0.2, 1) */
.transition-slow  /* 300ms cubic-bezier(0.4, 0, 0.2, 1) */
```

## Color Palette

### Primary Colors
- **Background**: #050505 (WinmixPro Dark)
- **Emerald**: #22c55e (Success, Primary actions)
- **Violet**: #a855f7 (Secondary actions, Accents)
- **Zinc**: #111827 - #1f2937 (Neutral tones)

### Semantic Colors
All colors use HSL variables for consistent theming:
- `--primary`: Emerald for main actions
- `--secondary`: Violet for secondary actions
- `--accent`: Emerald for highlights
- `--destructive`: Red for danger states

## Typography

- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 100-900
- **Letter Spacing**: -0.01em (tight)

## Animations

### Keyframes
- `shimmer`: Shimmering text effect
- `fade-in`: Fade in with slide up
- `slide-in-bottom`: Slide in from bottom
- `slide-in-right`: Slide in from right

### Transitions
- All elements default to 200ms transitions
- Customizable with transition utilities

## Usage Example

```tsx
import {
  AdminLayout,
  LayoutGrid,
  GridCell,
  GlassCard,
  SectionTitle,
  StatCard,
  MetricPill,
} from '@/winmixpro';
import { BarChart3, Users, Zap } from 'lucide-react';

export function MyAdminPage() {
  return (
    <AdminLayout userEmail="admin@example.com">
      <div className="space-y-8">
        {/* Page Title */}
        <SectionTitle
          title="Dashboard"
          subtitle="System overview and metrics"
          icon={<BarChart3 className="w-6 h-6" />}
        />

        {/* Metric Pills */}
        <div className="flex flex-wrap gap-4">
          <MetricPill
            label="Active Users"
            value="1,234"
            icon={<Users className="w-4 h-4" />}
            variant="emerald"
          />
          <MetricPill
            label="Running Jobs"
            value="12"
            icon={<Zap className="w-4 h-4" />}
            variant="violet"
          />
        </div>

        {/* 3-6-3 Layout */}
        <LayoutGrid variant="3-6-3" className="gap-6">
          {/* Left Sidebar */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Filters</h3>
            {/* Filter content */}
          </GlassCard>

          {/* Main Content */}
          <div className="space-y-6">
            <StatCard
              title="Total Predictions"
              value="45,291"
              icon={<BarChart3 className="w-5 h-5" />}
              change={{ value: 12, direction: 'up' }}
            />
            <GlassCard className="p-6">
              {/* Main content */}
            </GlassCard>
          </div>

          {/* Right Panel */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
            {/* Stats content */}
          </GlassCard>
        </LayoutGrid>
      </div>
    </AdminLayout>
  );
}
```

## Responsive Design Considerations

### Mobile-First Approach
- Components default to mobile layout (1 column)
- Desktop optimizations applied at `md` and `lg` breakpoints
- Touch-friendly sizes (min 44px height for interactive elements)

### Breakpoints
- `sm`: 640px
- `md`: 768px (tablet starts here)
- `lg`: 1024px (desktop layout)
- `xl`: 1280px
- `2xl`: 1536px

### Header & Sidebar
- Header: Always visible (sticky)
- Sidebar: Hidden on mobile, visible on md+ (fixed)
- Mobile Menu: Overlay drawer on mobile only

## Performance

### Optimizations
- CSS Grid for efficient layouts
- Backdrop blur GPU-accelerated
- Smooth transitions (200ms default)
- No layout thrashing
- Shimmer animation GPU-optimized

### Bundle Size
- Tree-shakeable exports
- Utility-first CSS approach
- Only loaded components are included

## Accessibility

### WCAG Compliance
- Proper heading hierarchy
- Color contrast ratios meet AA standards
- Focus indicators on interactive elements
- ARIA labels on mobile menu toggle
- Semantic HTML structure

### Keyboard Navigation
- Tab order follows visual hierarchy
- Enter/Space to activate buttons
- Escape to close mobile menu
- Arrow keys for navigation (future enhancement)

## Customization

### Extending Colors
Update `tailwind.config.ts`:
```tsx
colors: {
  emerald: { /* Custom emerald palette */ },
  violet: { /* Custom violet palette */ },
}
```

### Custom Breakpoints
Update `tailwind.config.ts`:
```tsx
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
}
```

### Custom Shadows
Update `tailwind.config.ts`:
```tsx
boxShadow: {
  'glass': '0 8px 20px rgba(0, 0, 0, 0.4)',
  'glass-lg': '0 20px 40px rgba(0, 0, 0, 0.5)',
}
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android 90+

## Demo

See `DemoPage.tsx` for a complete showcase of all components:

```tsx
import { WinmixProDemoPage } from '@/winmixpro/DemoPage';
```

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Custom color themes
- [ ] Animation preferences (respects prefers-reduced-motion)
- [ ] Right-to-left (RTL) language support
- [ ] Voice navigation for accessibility
- [ ] Additional admin destinations as needed
