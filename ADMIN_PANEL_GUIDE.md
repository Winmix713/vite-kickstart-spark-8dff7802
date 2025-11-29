# WinMix Admin Panel - Teljes Útmutató

## Áttekintés

A WinMix Admin Panel egy teljes körű adminisztrációs felület a rendszer kezeléséhez, monitorozásához és optimalizálásához.

## Funkciók

### 1. Dashboard (`/admin`)

**Főbb Funkciók:**
- Valós idejű rendszer áttekintés
- Felhasználók száma és szerepkörök
- Futó job-ok monitorozása
- AI modellek státusza
- Adatbázis metrikák
- Phase 9 collaborative intelligence állapot

**Optimalizációk:**
- Egyesített metrika lekérdezés (1 API hívás 5 helyett)
- Intelligens cache (60s staleTime, 120s refetch)
- Memoizált számítások
- Lazy loading nagy komponensekhez

### 2. Felhasználó Kezelés (`/admin/users`)

**Funkciók:**
- Felhasználók listázása
- Szerepkör kezelés (admin, analyst, user)
- Felhasználó létrehozás/szerkesztés/törlés
- Aktivitás napló

**API Műveletek:**
```typescript
// Felhasználók lekérése
const users = await adminAPIService.getUsers({ useCache: true });

// Felhasználó frissítése
const result = await adminAPIService.updateUser(userId, {
  role: 'analyst',
  full_name: 'John Doe'
});

// Felhasználó törlése
await adminAPIService.deleteUser(userId);
```

### 3. Job Kezelés (`/admin/jobs`)

**Funkciók:**
- Ütemezett job-ok listázása
- Job státusz monitorozás (running, completed, failed)
- Job indítás/leállítás
- Log megtekintés
- Job konfiguráció szerkesztése

**Job Típusok:**
- Model Training Jobs
- Data Sync Jobs
- Analytics Jobs
- Maintenance Jobs

### 4. Model Control Center (`/admin/model-status`)

**Funkciók:**
- AI modellek listázása
- Model promotion (challenger → champion)
- Model training trigger
- Performance analytics
- Prediction confidence monitoring
- Data configuration

**Komponensek:**
- System Status Panel
- Analytics Dashboard
- Training Controls
- Prediction Review Panel
- Data Configuration Panel

### 5. Integrations (`/admin/integrations`)

**Támogatott Integrációk:**
- GitHub (webhooks, CI triggers)
- Linear (issue tracking)
- Slack (notifications)
- Cloudflare (observability)
- Neon Postgres
- Notion (documentation)
- Prisma (ORM)
- Render (hosting)
- Sentry (error tracking)
- Webflow (marketing)

**Státusz Ellenőrzés:**
```typescript
// Integration státusz
const status = await validateIntegrationKeys('github');

// Test error to Sentry
captureExceptionSafe(new Error('Test'), { test: true });
```

### 6. Health Dashboard (`/admin/health`)

**Metrikák:**
- Database connection status
- API response times
- Error rates
- Memory usage
- CPU usage
- Cache hit rates
- Active users
- System uptime

**Real-time Monitoring:**
```typescript
import { useHealthMetrics } from '@/hooks/admin/useHealthMetrics';

const metrics = useHealthMetrics();
console.log(metrics.dbResponseTime, metrics.errorRate);
```

### 7. Statistics (`/admin/stats`)

**Statisztikák:**
- Match outcome distribution
- Goal histograms
- Top scorelines
- Data quality checks
- Team performance metrics

**Szűrők:**
- Team selection
- Home/Away filter
- Date range filter
- League filter

### 8. Phase 9 Settings (`/admin/phase9`)

**Beállítások:**
- Collaborative intelligence toggle
- Market integration mode
- Sentiment analysis
- External data sources
- API rate limits

## API Használat

### Admin API Service

```typescript
import { adminAPIService } from '@/lib/admin-api-service';

// Users
const users = await adminAPIService.getUsers({ useCache: true, cacheTTL: 60000 });

// Models
const models = await adminAPIService.getModels();

// Matches
const matches = await adminAPIService.getMatches(100);

// Jobs
const jobs = await adminAPIService.getJobs({ useCache: false });

// Update operations
await adminAPIService.updateUser(userId, updates);
await adminAPIService.updateModel(modelId, updates);

// Cache management
await adminAPIService.invalidateAllCaches();

// Health check
const health = await adminAPIService.getHealthStatus();
```

### Admin Connection Manager

```typescript
import { adminConnectionManager } from '@/lib/admin-connection-manager';

// Fetch with cache
const data = await adminConnectionManager.fetchWithCache(
  'user_profiles',
  (query) => query.select('*').order('created_at', { ascending: false }),
  { ttl: 60000, cacheKey: 'all-users' }
);

// Batch fetch
const results = await adminConnectionManager.batchFetch([
  {
    key: 'users',
    table: 'user_profiles',
    queryBuilder: (q) => q.select('id, email, role')
  },
  {
    key: 'models',
    table: 'model_registry',
    queryBuilder: (q) => q.select('*').eq('is_active', true)
  }
]);

// Optimized queries
const activeUsers = await adminConnectionManager.optimizeQueries(
  'user_profiles',
  ['id', 'email', 'role'],
  { role: 'admin' },
  { limit: 50, orderBy: 'created_at', ascending: false }
);
```

### Admin Utils

```typescript
import {
  getSystemMetrics,
  getTableStats,
  bulkUpdate,
  validateDatabaseConnection,
  formatBytes,
  formatDuration,
  calculatePercentageChange,
  getRecentActivity
} from '@/lib/admin-utils';

// System metrics
const metrics = await getSystemMetrics();

// Table stats
const userStats = await getTableStats('user_profiles');

// Bulk operations
const result = await bulkUpdate('teams', [
  { id: '1', data: { form_rating: 85 } },
  { id: '2', data: { form_rating: 92 } }
]);

// DB connection
const dbStatus = await validateDatabaseConnection();

// Formatting
formatBytes(1024000); // "1000 KB"
formatDuration(65000); // "1.1m"
calculatePercentageChange(120, 100); // 20

// Activity
const activities = await getRecentActivity(10);
```

## Role-Based Access Control (RBAC)

### Szerepkörök

1. **Admin**
   - Teljes hozzáférés minden funkcióhoz
   - Felhasználó kezelés
   - Rendszer beállítások
   - Kritikus műveletek

2. **Analyst**
   - Model management
   - Analytics dashboards
   - Job management
   - Read-only user access

3. **User**
   - Public pages
   - Personal dashboard
   - Limited predictions

### Route Guards

```typescript
// Protected route with role check
<ProtectedRoute requiredRoles={['admin', 'analyst']}>
  <AdminDashboard />
</ProtectedRoute>

// Hook usage
const { authorized, loading, error } = useRequireRole(['admin']);
```

## Performance Best Practices

### 1. Cache Használat

```typescript
// GOOD: Cache-el
const data = await adminAPIService.getUsers({ useCache: true, cacheTTL: 60000 });

// BAD: Cache nélkül minden alkalommal
const data = await adminAPIService.getUsers({ useCache: false });
```

### 2. Batch Műveletek

```typescript
// GOOD: Batch fetch
const results = await adminConnectionManager.batchFetch([...queries]);

// BAD: Sequential fetches
const users = await fetchUsers();
const models = await fetchModels();
const matches = await fetchMatches();
```

### 3. Memoization

```typescript
// GOOD: Memoized calculation
const filtered = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// BAD: Calculate on every render
const filtered = data.filter(item => item.active);
```

### 4. Lazy Loading

```typescript
// GOOD: Lazy loaded component
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));

// BAD: Direct import
import AdminDashboard from '@/pages/admin/AdminDashboard';
```

## Troubleshooting

### Common Issues

1. **Lassú Dashboard Betöltés**
   - Ellenőrizd a cache hit rate-et
   - Csökkentsd a refetch intervallumot
   - Használj lazy loading-ot

2. **Database Connection Errors**
   ```typescript
   const dbStatus = await validateDatabaseConnection();
   if (!dbStatus.connected) {
     console.error('DB connection failed:', dbStatus.error);
   }
   ```

3. **Cache Problémák**
   ```typescript
   // Invalidáld a cache-t ha elavult adatokat látsz
   await adminAPIService.invalidateAllCaches();
   ```

4. **Permission Denied**
   - Ellenőrizd a user role-t
   - Nézd meg az RLS policy-kat
   - Ellenőrizd az auth session-t

## Monitoring

### Health Metrics

```typescript
import { useHealthMetrics } from '@/hooks/admin/useHealthMetrics';

const HealthMonitor = () => {
  const metrics = useHealthMetrics();
  
  return (
    <div>
      <div>DB Status: {metrics?.dbConnectionStatus}</div>
      <div>Response Time: {metrics?.dbResponseTime}ms</div>
      <div>Error Rate: {metrics?.errorRate}%</div>
    </div>
  );
};
```

### Cache Stats

```typescript
import { connectionPool } from '@/lib/connection-pool';

const stats = connectionPool.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Cached keys:', stats.keys);
```

## Security

### Best Practices

1. **Environment Variables**
   - Soha ne tárold a secreteket VITE_* változókban
   - Használd az `environment_variables` táblát server-side secretekhez
   - Ellenőrizd a környezeti változókat induláskor

2. **RLS Policies**
   - Minden admin műveletet védj RLS policy-val
   - Ellenőrizd a user role-t minden lekérdezésnél
   - Használj Row Level Security-t

3. **Audit Logging**
   - Logolja minden admin műveletet
   - Tárold a user ID-t és timestamp-et
   - Implementálj audit trail-t

## Fejlesztési Útmutató

### Új Admin Feature Hozzáadása

1. **Route Definíció**
```typescript
// src/components/AppRoutes.tsx
<Route path="/admin/new-feature" element={
  <ProtectedRoute requiredRoles={['admin']}>
    <Suspense fallback={<PageLoading />}>
      <NewFeaturePage />
    </Suspense>
  </ProtectedRoute>
} />
```

2. **Page Component**
```typescript
// src/pages/admin/NewFeaturePage.tsx
import AdminLayout from '@/components/admin/AdminLayout';

export default function NewFeaturePage() {
  return (
    <AdminLayout
      title="New Feature"
      description="Description"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "New Feature" }
      ]}
    >
      {/* Content */}
    </AdminLayout>
  );
}
```

3. **API Service**
```typescript
// src/lib/admin-api-service.ts
async getNewFeatureData(options: AdminServiceOptions = {}) {
  return this.fetchWithCache(
    'table_name',
    (query) => query.select('*'),
    options
  );
}
```

## Támogatás

Ha segítségre van szükséged:
1. Nézd meg a dokumentációt: `/docs/admin/`
2. Ellenőrizd a kód példákat: `/src/pages/admin/`
3. Használd a type definitions-t: `/src/types/admin.ts`
4. Konzultálj a REFACTORING_SUMMARY.md-vel

## Changelog

### v2.0.0 - Major Refactoring
- ✅ Implementált connection pooling és cache
- ✅ Admin API service központosítás
- ✅ Performance optimalizációk (70-80% javulás)
- ✅ Javított error handling és logging
- ✅ Admin utils library
- ✅ Comprehensive documentation

### v1.0.0 - Initial Release
- Basic admin functionality
- User management
- Model control
- Job scheduling
