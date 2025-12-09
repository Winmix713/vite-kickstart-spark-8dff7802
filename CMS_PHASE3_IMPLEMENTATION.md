# CMS Supabase Page Layouts - Phase 3 Implementation

## Overview
This document describes the Phase 3 implementation of the CMS feature, which persists builder layouts in Supabase with admin-only access, exposes React Query helpers, and integrates them into the builder UI.

## Implementation Summary

### 1. Database Schema
**Location:** `supabase/migrations/20250201000000_cms_pages.sql`

Creates two main tables:

#### `public.pages`
- `id` (uuid, primary key, auto-generated)
- `slug` (text, unique, indexed) - URL-friendly identifier
- `title` (text) - Display name
- `is_published` (boolean, default: false) - Publication status
- `created_at` (timestamptz, default: now())

#### `public.page_layouts`
- `id` (uuid, primary key, auto-generated)
- `page_id` (uuid, foreign key) - References pages with ON DELETE CASCADE
- `layout_json` (jsonb) - Stores layout data: `{ instances: {...}, layout: [...] }`
- `updated_at` (timestamptz, auto-updated by trigger)

**Indexes:**
- `idx_pages_slug` on pages(slug)
- `idx_page_layouts_page_id` on page_layouts(page_id)

**Triggers:**
- Auto-update `updated_at` on page_layouts modification

**RLS Policies:**
- Admin-only CRUD access via `public.is_admin()` function
- Service role bypass for migrations
- All operations checked with RLS enabled

### 2. Service Layer
**Location:** `src/services/cms/pageLayouts.js`

Exports the following functions:

#### `loadPageLayout(pageId)`
Fetches the latest layout and page metadata by page ID.
- Returns: Layout object with `layout_json` and page metadata
- Handles: PGRST116 error (no data) returns null
- Error handling: Throws on database errors

#### `savePageLayout(pageId, layoutPayload)`
Upserts layout data, handling both new and existing layouts.
- Params: `pageId` (uuid), `layoutPayload` (object with instances and layout)
- Returns: Updated layout record
- Uses: Upsert with conflict detection on `page_id`

#### `createPage(slug, title, initialLayout)`
Creates a new page with optional initial layout.
- Params: `slug` (string), `title` (string), `initialLayout` (optional)
- Returns: Created page record
- Behavior: Cascade creates page_layouts if initialLayout provided

#### `getPageBySlug(slug)`
Retrieves page by URL slug.
- Params: `slug` (string)
- Returns: Page record or null

#### `deletePage(pageId)`
Deletes page (layouts cascade delete).
- Params: `pageId` (uuid)

#### `updatePageMetadata(pageId, updates)`
Updates page metadata (title, slug, is_published).
- Params: `pageId`, `updates` (object)
- Returns: Updated page record

### 3. Redux Slice (CMS)
**Location:** `src/features/cms/pageLayoutsSlice.js`

**State Structure:**
```javascript
{
  currentPageId: null,              // Active page ID
  layouts: {},                       // { pageId: { instances, layout } }
  isDirty: boolean,                 // Has unsaved changes
  lastSavedSnapshot: null,          // JSON string for comparison
  isLoading: boolean,               // Query loading state
  error: null,                      // Error message if any
  lastSaveTime: null,              // ISO timestamp of last save
}
```

**Actions:**
- `setCurrentPageId` - Set active page
- `loadLayoutSuccess` - Populate layout from Supabase
- `loadLayoutError` - Set load error
- `loadLayoutPending` - Set loading flag
- `updateLayoutInstances` - Update widget configuration
- `updateLayoutGrid` - Update grid positions
- `updateLayout` - Bulk update (marks dirty)
- `markAsSaved` - Clear dirty flag after save
- `saveError` - Set error while keeping dirty
- `resetLayout` - Clear specific page layout
- `clearAllLayouts` - Reset all state

### 4. React Query Hooks
**Location:** `src/hooks/cms/`

#### `usePageLayout(pageId, options)`
Loads page layout from Supabase and syncs to Redux.
- **Query Key:** `['pageLayouts', 'detail', pageId]`
- **Stale Time:** 5 minutes
- **Retry:** 2 attempts with exponential backoff
- **On Success:** Dispatches `loadLayoutSuccess` action
- **On Error:** Dispatches `loadLayoutError` action
- **Returns:** `{ data, isLoading, isError, error, refetch }`

#### `useSavePageLayout()`
Mutation for saving layouts to Supabase.
- **On Success:** 
  - Dispatches `markAsSaved`
  - Invalidates queries
  - Shows success toast
- **On Error:**
  - Dispatches `saveError` (keeps isDirty true)
  - Shows error toast
- **Returns:** `{ save, saveAsync, isPending, isError, error, isDirty }`

#### `useAutosaveLayout(pageId, options)`
Debounced autosave with smart change detection.
- **Default Debounce:** 5 seconds
- **Options:** `{ debounceMs, enabled, showToasts }`
- **Behavior:**
  - Watches `isDirty`, `layouts`, `lastSavedSnapshot`
  - Debounces to prevent rapid saves
  - Compares snapshot to avoid unnecessary saves
  - Cancels pending saves on unmount
  - Respects `enabled` option
- **Returns:** `{ isSaving, hasChanges }`

### 5. UI Components
**Location:** `src/components/`

#### `BuilderLayout.jsx`
Main editor container component.
- **Props:**
  - `pageId` - ID of page to edit
  - `initialLayout` - Default layout fallback
  - `onSave` - Callback after save
- **Features:**
  - Loads layout via `usePageLayout`
  - Displays "Unsaved Changes" indicator
  - Shows "Autosaving..." status
  - Manual Save button (disabled when clean)
  - Loading/error states
  - Integrates GridEditor

#### `GridEditor.jsx`
Responsive grid layout editor using react-grid-layout.
- **Features:**
  - Draggable widgets
  - Resizable widgets
  - Widget preview with type/title
  - Responsive breakpoints (lg, md, sm, xs, xxs)
  - Callback on layout changes
- **Styling:** GridEditor.scss with custom grid item styles

### 6. Integration Points

#### Redux Store
Located in `src/app/store.js`:
```javascript
{
  todos: todosReducer,
  pageLayouts: pageLayoutsReducer,  // NEW
}
```

#### Supabase Client
Uses existing client from `@/integrations/supabase/client`

#### React Query
Already configured in App.jsx with QueryClientProvider

#### Notifications
Uses react-toastify (already installed) for:
- Save success/failure
- Autosave progress
- Error messages

### 7. Test Coverage
**Location:** `src/test/`

#### Service Layer Tests
`services/cms/pageLayouts.test.js`
- Load existing layout
- Load non-existent layout (returns null)
- Save new layout
- Save failure handling
- Create page with layout
- Get page by slug
- Delete page
- Update page metadata

#### Autosave Hook Tests
`hooks/cms/useAutosaveLayout.test.js`
- Debounce timing (5 seconds)
- Skip save when not dirty
- Cancel saves on unmount
- Skip save if snapshot unchanged
- Skip save during pending mutation
- Respect enabled option
- Custom debounceMs option
- Return correct hasChanges status

#### Redux Slice Tests
`features/cms/pageLayoutsSlice.test.js`
- Initial state
- Set current page
- Load layout success
- Load layout error
- Update layout (dirty flag)
- Mark as saved
- Save error (keep dirty)
- Reset layout
- Clear all layouts
- Multiple page handling
- Dirty state transitions

## Usage Example

```jsx
import BuilderLayout from '@/components/BuilderLayout'

function CMSPage() {
  return (
    <BuilderLayout
      pageId="page-123"
      initialLayout={{ instances: {}, layout: [] }}
      onSave={(layout) => console.log('Saved:', layout)}
    />
  )
}
```

## Key Features

### Offline Support
- Local Redux state persists changes
- Failed saves keep `isDirty = true`
- Manual retry available via Save button

### Smart Autosave
- 5-second debounce prevents server spam
- Snapshot comparison avoids redundant saves
- Cancels on unmount to prevent memory leaks
- Shows user feedback via toasts

### Admin-Only Access
- RLS policies enforce admin role check
- Service role bypass for migrations
- Graceful fallback to deny on error

### Error Handling
- Supabase errors surface as toasts
- Load failures show in UI
- Save failures keep unsaved changes
- Retry-able via Save button

## Acceptance Criteria Met

✅ **Database:** Migration creates tables with RLS, admin-only access, proper indexes and triggers
✅ **Service Layer:** `loadPageLayout` and `savePageLayout` persist exact layout/instances data
✅ **Autosave:** 5-second debounce, stops when data matches saved snapshot
✅ **Builder UI:** Loading/saving states, error handling, graceful offline support
✅ **Testing:** Service layer, autosave, and Redux slice covered with Vitest

## Next Steps (Future Phases)

- Integrate BuilderLayout into admin pages
- Add widget registry and runtime renderer
- Implement layout versioning/history
- Add publish workflow
- Export/import layouts
- Multi-user collaboration
