# WinMix TipsterHub RLS Policy Matrix

## Table Classification & Access Control

### System Tables (Admin/Service Access Only)
| Table | Description | Access Level | RLS Policy |
|-------|-------------|--------------|------------|
| `leagues` | League reference data | Public READ, Admin WRITE | Public can read, only admins can modify |
| `teams` | Team reference data | Public READ, Admin WRITE | Public can read, only admins can modify |
| `pattern_templates` | Pattern configuration | Public READ, Admin WRITE | Public can read, only admins can modify |
| `pattern_definitions` | Pattern detection config | Admin only | Full admin control |
| `scheduled_jobs` | Job registry | Service/Admin only | Service and admin access |
| `job_execution_logs` | Job execution history | Service/Admin only | Service and admin access |
| `model_performance` | Model analytics | Analyst/Admin READ | Analysts can read, admins full access |
| `model_comparison` | Model comparison data | Analyst/Admin READ | Analysts can read, admins full access |
| `cross_league_correlations` | Cross-league analytics | Analyst/Admin READ | Analysts can read, admins full access |
| `meta_patterns` | Meta pattern data | Analyst/Admin READ | Analysts can read, admins full access |
| `league_characteristics` | League analytics | Analyst/Admin READ | Analysts can read, admins full access |
| `system_health` | System monitoring | Analyst/Admin READ | Analysts can read, admins full access |
| `performance_metrics` | Performance data | Analyst/Admin READ | Analysts can read, admins full access |
| `computation_graph` | Pipeline configuration | Admin only | Full admin control |
| `crowd_wisdom` | Aggregated user data | Public READ, Service WRITE | Public can read, service writes |
| `market_odds` | External odds data | Public READ, Service WRITE | Public can read, service writes |
| `value_bets` | Value bet calculations | Public READ, Service WRITE | Public can read, service writes |
| `information_freshness` | Data freshness tracking | Service/Admin only | Service and admin access |
| `feature_experiments` | ML experiments | Analyst/Admin READ/WRITE | Analysts can read/write, admins full |
| `pattern_accuracy` | Pattern performance | Public READ, Service WRITE | Public can read, service writes |

### User-Owned Tables (Row-Level Security)
| Table | Description | Access Level | RLS Policy |
|-------|-------------|--------------|------------|
| `matches` | Match data | Public READ, Admin WRITE | Public can read, only admins can modify |
| `detected_patterns` | Pattern detections | Owner READ, Analyst/Admin READ/WRITE | Users see their own, analysts see all |
| `predictions` | System predictions | Public READ, Service WRITE | Public can read, service writes |
| `team_patterns` | Team pattern data | Owner READ, Analyst/Admin READ/WRITE | Users see their own, analysts see all |
| `user_predictions` | User predictions | Owner FULL access | Users can CRUD their own predictions only |

## User Roles & Permissions

### Role Hierarchy
1. **admin** - Full system access
2. **analyst** - Read access to analytics, write to experiments
3. **viewer** - Read-only access to public data
4. **demo** - Read-only access with rate limiting

### Role-Based Access Rules
- **Anonymous users**: Can read public tables (leagues, teams, matches, public analytics)
- **Authenticated users**: Inherit viewer role + access to their own data
- **Analysts**: All viewer permissions + read analytics + write experiments
- **Admins**: Full system access

## Security Functions

### Helper Functions
- `current_app_role()` - Returns current user's role
- `is_admin()` - Check if user has admin role
- `is_analyst()` - Check if user has analyst role
- `is_service_role()` - Check if request is from service

### Ownership Checks
- `created_by` columns on user-owned tables
- `auth.uid()` for current user identification
- Row-level filtering based on ownership

## Policy Implementation Strategy

### Phase 1: Foundation
1. Add `created_by` columns to user-owned tables
2. Create `user_profiles` table with role management
3. Create security helper functions
4. Backfill existing data with service ownership

### Phase 2: Policy Implementation
1. Enable FORCE ROW LEVEL SECURITY on all tables
2. Remove permissive "allow all" policies
3. Implement deny-by-default policies
4. Add granular role-based policies
5. Add ownership-based policies for user data

### Phase 3: Testing & Validation
1. Create automated security tests
2. Verify anonymous access restrictions
3. Test role-based access controls
4. Validate ownership isolation

## Migration Notes

### Backfill Strategy
- Historical data without owners will be assigned to service role
- User prediction data will be linked to user_profiles
- System-generated data maintains service ownership

### Performance Considerations
- Indexes on `created_by` columns for fast ownership checks
- Separate policies for different operation types (SELECT, INSERT, UPDATE, DELETE)
- Minimal policy expressions to avoid performance overhead

### Monitoring
- Audit logs for policy violations
- Performance metrics for policy evaluation overhead
- Regular security reviews of policy effectiveness