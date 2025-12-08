# Backend Integration Guide

**Last Updated:** 2025-01-01  
**Version:** 1.0  
**Purpose:** Document the new WinMix API service layer and integration patterns

---

## Overview

The WinMix API service layer (`src/services/winmixApi.ts`) provides a comprehensive typed data-access layer that wraps the Supabase client and exposes focused helpers for all WinMix widgets and components. This service normalizes responses to ensure existing UI components can consume them without structural rewrites.

## Architecture

### Service Layer Structure

```
src/services/
├── winmixApi.ts           # Main API service layer
├── matchService.ts        # Basic match CRUD operations
├── teamService.ts         # Basic team CRUD operations
├── leagueService.ts       # Basic league CRUD operations
└── userService.ts         # Basic user CRUD operations
```

### Key Design Principles

1. **Typed Data Access**: All methods are fully typed against the Supabase database schema
2. **Response Normalization**: Data is transformed to match existing UI component expectations
3. **Error Handling**: Consistent error patterns and graceful fallbacks
4. **Performance Optimized**: Efficient queries with minimal data transfer
5. **Cache Friendly**: Designed to work seamlessly with React Query

## API Methods Reference

### Core Data Methods

#### `fetchLeagueStandings(leagueId: string): Promise<LeagueStanding[]>`
- **Purpose**: Get complete league table with calculated stats and form
- **Source Tables**: `matches`, `teams`, `leagues`
- **Caching**: 10 minutes stale time
- **Returns**: Normalized standings with positions, stats, and form data
- **Related Documentation**: 
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 47-89)
  - API Reference: `/docs/05-api-reference/API_REFERENCE.md` (lines 13-351)

#### `fetchLiveMatches(): Promise<MatchWithTeams[]>`
- **Purpose**: Get currently live matches with team and league data
- **Source Tables**: `matches`, `teams`, `leagues`
- **Caching**: 2 minutes stale time, 30-second auto-refresh
- **Returns**: Live matches with full team and league context
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 75-89)

#### `fetchFinishedMatches(limit?: number): Promise<MatchWithTeams[]>`
- **Purpose**: Get completed matches ordered by date
- **Source Tables**: `matches`, `teams`, `leagues`
- **Caching**: 10 minutes stale time
- **Returns**: Historical matches with full context
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 75-89)

#### `fetchPredictions(limit?: number): Promise<PredictionData[]>`
- **Purpose**: Get AI predictions with match context and model information
- **Source Tables**: `predictions`, `matches`, `teams`, `leagues`
- **Caching**: 5 minutes stale time, 1-minute auto-refresh
- **Returns**: Predictions with outcome, confidence, and model metadata
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 121-153)
  - API Reference: `/docs/05-api-reference/API_REFERENCE.md` (lines 149-274)

#### `fetchTeamAnalytics(teamId: string): Promise<TeamAnalytics>`
- **Purpose**: Get comprehensive team performance analytics
- **Source Tables**: `teams`, `matches`, `leagues`
- **Caching**: 10 minutes stale time
- **Returns**: Team stats, recent form, and upcoming matches
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 63-74, 201-218)

### Utility Methods

#### `fetchPlayerProfile(playerId: string): Promise<PlayerWithStats | null>`
- **Purpose**: Get player information with performance statistics
- **Source Tables**: `players` (with fallback to mock data)
- **Caching**: 15 minutes stale time
- **Returns**: Player data with calculated stats
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 117-118)

#### `fetchStoreInventory(category?: string): Promise<ProductInventory[]>`
- **Purpose**: Get product catalog with categories and variants
- **Source Tables**: `products`, `product_categories`
- **Caching**: 5 minutes stale time
- **Returns**: Product catalog with pricing and availability
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 467-490)

#### `fetchChatMessages(conversationId?: string): Promise<ChatMessageWithUser[]>`
- **Purpose**: Get chat messages with user context
- **Source Tables**: `chat_messages`, `user_profiles`
- **Caching**: 30 seconds stale time, 10-second auto-refresh
- **Returns**: Chat history with user profiles
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 166-187)

#### `fetchSchedule(type?: string): Promise<ScheduleItem[]>`
- **Purpose**: Get upcoming schedule items
- **Source Tables**: `schedule`
- **Caching**: 30 minutes stale time
- **Returns**: Schedule items with details and status
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 461-477)

#### `fetchTodos(): Promise<Todo[]>`
- **Purpose**: Get task list with priorities and status
- **Source Tables**: `todos` (if exists)
- **Caching**: 2 minutes stale time
- **Returns**: Task list with completion status
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 384-405)

#### `fetchSystemStatus(): Promise<SystemStatus>`
- **Purpose**: Get system health metrics and status
- **Source Tables**: `system_health_metrics`
- **Caching**: 1 minute stale time, 1-minute auto-refresh
- **Returns**: System health indicators and metrics
- **Related Documentation**:
  - Database Schema: `/docs/06-database/supabase_allapot_2026_hu.md` (lines 443-458)
  - API Reference: `/docs/05-api-reference/API_REFERENCE.md` (lines 277-304)

## React Hooks Integration

### Main Hook: `useWinmixQuery`

The `useWinmixQuery` hook provides a consistent interface for calling WinMix API helpers:

```typescript
import { useWinmixQuery } from '@/hooks/useWinmixQuery'

// Generic usage
const { data, isLoading, error, refetch } = useWinmixQuery(
  'fetchLeagueStandings',
  ['league-id-123']
)

// Specialized hooks
const { data: standings } = useLeagueStandings('league-id-123')
const { data: liveMatches } = useLiveMatches()
const { data: predictions } = usePredictions()
```

### Specialized Hooks

| Hook | Purpose | Auto-refresh |
|------|---------|--------------|
| `useLeagueStandings(leagueId)` | League table data | No |
| `useLiveMatches()` | Live match data | 30 seconds |
| `useFinishedMatches(limit)` | Historical matches | No |
| `usePlayerProfile(playerId)` | Player statistics | No |
| `useStoreInventory(category)` | Product catalog | No |
| `useChatMessages(conversationId)` | Chat messages | 10 seconds |
| `useSchedule(type)` | Event schedule | No |
| `usePredictions(limit)` | AI predictions | 1 minute |
| `useTodos()` | Task list | No |
| `useSystemStatus()` | Health metrics | 1 minute |
| `useTeamAnalytics(teamId)` | Team analytics | No |

## Widget Integration Examples

### Basic Widget Usage

```typescript
import { useLeagueStandings } from '@/hooks/useWinmixQuery'
import LoadingScreen from '@/components/LoadingScreen'

const LeagueStandingsWidget = ({ leagueId }) => {
  const { data: standings, isLoading, error } = useLeagueStandings(leagueId)
  
  if (isLoading) return <LoadingScreen />
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {standings?.map(standing => (
        <div key={standing.team.id}>
          {standing.position}. {standing.team.name} - {standing.stats.points} pts
        </div>
      ))}
    </div>
  )
}
```

### Memoized Data Transformation

```typescript
import { useLeagueStandingsSelector } from '@/hooks/useWinmixQuery'

const TopThreeTeams = ({ standings }) => {
  const topThree = useLeagueStandingsSelector(standings, data => 
    data?.slice(0, 3) || []
  )
  
  return (
    <div>
      {topThree.map(team => (
        <div key={team.team.id}>
          {team.team.name} - Champions League
        </div>
      ))}
    </div>
  )
}
```

### Real-time Updates

```typescript
import { useLiveMatches } from '@/hooks/useWinmixQuery'

const LiveMatchesWidget = () => {
  const { data: matches } = useLiveMatches({
    refetchInterval: 30000 // 30 seconds
  })
  
  return (
    <div>
      {matches?.map(match => (
        <MatchCard 
          key={match.id}
          homeTeam={match.home_team.name}
          awayTeam={match.away_team.name}
          homeScore={match.home_score}
          awayScore={match.away_score}
          status={match.status}
        />
      ))}
    </div>
  )
}
```

## Data Transformation

### Response Normalization

The service layer normalizes database responses to match UI component expectations:

#### League Standings Transformation
```typescript
// Raw database data
{
  team_id: "123",
  team_name: "Arsenal FC",
  matches: [...],
  goals_for: 45,
  goals_against: 23,
  // ...
}

// Normalized response
{
  position: 1,
  team: {
    id: "123",
    name: "Arsenal FC",
    short_name: "ARS",
    logo_url: "..."
  },
  stats: {
    played: 20,
    won: 15,
    drawn: 3,
    lost: 2,
    goals_for: 45,
    goals_against: 23,
    goal_difference: 22,
    points: 48
  },
  form: "WWLWD"
}
```

#### Match Data Transformation
```typescript
// Raw database data with joins
{
  id: "match-123",
  home_team_id: "team-1",
  away_team_id: "team-2",
  league_id: "league-1",
  home_team: { name: "Arsenal", short_name: "ARS" },
  away_team: { name: "Chelsea", short_name: "CHE" },
  league: { name: "Premier League" },
  // ...
}

// Normalized for UI
{
  id: "match-123",
  home_team: { name: "Arsenal", short_name: "ARS" },
  away_team: { name: "Chelsea", short_name: "CHE" },
  league: { name: "Premier League" },
  home_score: 2,
  away_score: 1,
  match_date: "2025-01-15T15:00:00Z",
  status: "finished"
}
```

## Error Handling

### Consistent Error Patterns

```typescript
try {
  const data = await winmixApi.fetchLeagueStandings(leagueId)
  return data
} catch (error) {
  console.error('Error fetching league standings:', error)
  
  // Throw with context
  throw new Error(`Failed to load league standings: ${error.message}`)
}
```

### Graceful Fallbacks

```typescript
// System status with fallback
async fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const { data } = await supabase
      .from('system_health_metrics')
      .select('*')
      .single()
    
    return {
      health: data.error_rate > 0.05 ? 'critical' : 'healthy',
      // ...
    }
  } catch (error) {
    // Return default status if no data
    return {
      health: 'healthy',
      uptime: 0,
      lastUpdated: new Date().toISOString(),
      metrics: { activeUsers: 0, responseTime: 0, errorRate: 0 }
    }
  }
}
```

## Performance Considerations

### Query Optimization

1. **Selective Field Queries**: Only fetch fields needed by UI components
2. **Efficient Joins**: Use Supabase foreign key relationships efficiently
3. **Pagination**: Apply limits for large datasets
4. **Index Utilization**: Queries designed to work with database indexes

### Caching Strategy

| Data Type | Stale Time | Refetch Interval | Cache Time |
|-----------|------------|------------------|------------|
| League Standings | 10 minutes | None | 5 minutes |
| Live Matches | 2 minutes | 30 seconds | 5 minutes |
| Finished Matches | 10 minutes | None | 5 minutes |
| Chat Messages | 30 seconds | 10 seconds | 5 minutes |
| System Status | 1 minute | 1 minute | 5 minutes |

### Memoized Selectors

Use the provided selector hooks for expensive data transformations:

```typescript
// Without memoization (recalculates on every render)
const expensiveData = useMemo(() => 
  transformLargeDataset(data), [data]
)

// With selector hook (caches transformation)
const transformedData = useLeagueStandingsSelector(data, transformLargeDataset)
```

## Database Schema References

### Primary Tables Used

1. **`matches`** - Match data with foreign keys to teams and leagues
2. **`teams`** - Team information and metadata
3. **`leagues`** - League configuration and settings
4. **`predictions`** - AI model predictions with confidence scores
5. **`user_profiles`** - User authentication and profile data
6. **`system_health_metrics`** - System monitoring and performance data

### RLS (Row Level Security)

All queries respect Supabase Row Level Security policies:
- Public read access for matches, teams, leagues
- User-specific access for predictions and user data
- Admin-only access for sensitive system tables

## Migration from Direct Supabase Usage

### Before (Direct Supabase)
```typescript
// Component code
const [matches, setMatches] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues!matches_league_id_fkey(*)
      `)
      .eq('status', 'live')
    
    setMatches(data || [])
    setLoading(false)
  }
  
  fetchMatches()
}, [])

return <div>{matches.map(match => ...)}</div>
```

### After (WinMix API)
```typescript
// Component code
const { data: matches, isLoading } = useLiveMatches()

return <div>{matches?.map(match => ...)}</div>
```

## Testing

### Unit Testing API Methods

```typescript
import { winmixApi } from '@/services/winmixApi'

describe('winmixApi', () => {
  test('fetchLeagueStandings returns normalized data', async () => {
    const standings = await winmixApi.fetchLeagueStandings('league-123')
    
    expect(standings).toHaveLength(20)
    expect(standings[0]).toHaveProperty('position')
    expect(standings[0]).toHaveProperty('team')
    expect(standings[0]).toHaveProperty('stats')
    expect(standings[0]).toHaveProperty('form')
  })
})
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeagueStandings } from '@/hooks/useWinmixQuery'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

test('useLeagueStandings hook', async () => {
  const { result } = renderHook(
    () => useLeagueStandings('league-123'),
    { wrapper: createWrapper() }
  )
  
  expect(result.current.isLoading).toBe(true)
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
  
  expect(result.current.data).toBeDefined()
  expect(result.current.error).toBeNull()
})
```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure Supabase types are generated and up-to-date
2. **Missing Tables**: Some methods use fallback data for optional tables
3. **RLS Policy Issues**: Check that user has appropriate permissions
4. **Query Performance**: Monitor slow queries and add database indexes

### Debug Mode

Enable debug logging:

```typescript
// In development environment
localStorage.setItem('winmix-debug', 'true')

// This will enable detailed logging in winmixApi methods
```

### Performance Monitoring

Monitor query performance:

```typescript
import { winmixApi } from '@/services/winmixApi'

// Wrap API calls with timing
const fetchWithTiming = async (method, ...params) => {
  const start = performance.now()
  const result = await winmixApi[method](...params)
  const end = performance.now()
  console.log(`${method} took ${end - start}ms`)
  return result
}
```

## Future Enhancements

### Planned Features

1. **Offline Support**: Service worker integration for offline data access
2. **Real-time Subscriptions**: WebSocket integration for live updates
3. **Advanced Caching**: More sophisticated cache invalidation strategies
4. **Data Compression**: Response compression for large datasets
5. **Batch Operations**: Multi-table queries for complex scenarios

### Schema Evolution

The service layer is designed to handle schema changes gracefully:
- Backward compatibility for existing methods
- Graceful degradation when optional tables are missing
- Clear typing for new fields and tables

---

## Related Documentation

- **Database Schema**: `/docs/06-database/supabase_allapot_2026_hu.md`
- **API Reference**: `/docs/05-api-reference/API_REFERENCE.md`
- **Architecture Overview**: `/docs/04-architecture/ARCHITECTURE_OVERVIEW.md`
- **System Audit Report**: `/docs/SYSTEM_AUDIT_2025-11.md`
- **Operations Runbook**: `/docs/OPERATIONS_RUNBOOK.md`

---

## Support

For questions or issues with the WinMix API service layer:
1. Check this documentation first
2. Review the source code in `/src/services/winmixApi.ts`
3. Examine the hook implementations in `/src/hooks/useWinmixQuery.ts`
4. Consult the database schema documentation
5. Check the system audit report for known issues