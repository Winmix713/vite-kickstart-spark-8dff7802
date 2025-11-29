# Comprehensive SQL Migration: Schema, RBAC, Functions, Triggers, and RLS

## Overview

Migration file: `20260120000000_comprehensive_schema_rbac_rls_functions_triggers.sql`

This comprehensive migration provides a production-ready implementation of the complete database infrastructure for the WinMix prediction platform. It includes:

1. **Complete Database Schema** - 12 core tables
2. **Role-Based Access Control (RBAC)** - 6 user roles with hierarchical permissions
3. **Authentication Functions** - User identity and authorization helpers
4. **Computation Functions** - Confidence scoring, probability calculations
5. **Trigger Functions** - Data consistency, audit logging, business logic
6. **Row Level Security (RLS) Policies** - Fine-grained access control on all tables
7. **Seed Data** - Initial demo data for leagues, teams, and patterns
8. **Performance Indexes** - Optimized queries for common operations

## Database Schema (Section 1)

### Core Tables

1. **leagues** - Sports leagues with aggregate statistics
   - League name, country, season
   - Average goals, home win %, BTTS %
   - Constraints: unique by (name, season)

2. **teams** - Teams within leagues
   - Team name, league reference
   - Optional: logo URL, founded year
   - Constraints: unique by (name, league_id)

3. **matches** - Football matches with scores
   - Home/away teams, league, date, score
   - Status: scheduled, live, finished, postponed, cancelled
   - Constraints: teams must be different, scores required if finished

4. **pattern_templates** - Predefined pattern types
   - Name, description, category
   - Base confidence boost (0-100)
   - Categories: form, h2h, league, team_specific, seasonal

5. **detected_patterns** - Concrete patterns for specific matches
   - Match-template mapping
   - Confidence contribution to prediction
   - Pattern-specific JSONB data
   - Created by user tracking

6. **predictions** - Core prediction table
   - Match ID, predicted outcome, confidence score
   - Score predictions, BTTS, over/under
   - Feedback fields: actual outcome, was_correct, evaluated_at
   - Created by user tracking

7. **pattern_accuracy** - Accuracy metrics for patterns
   - Template reference
   - Total predictions, correct predictions
   - Calculated accuracy rate
   - Last updated timestamp

8. **user_profiles** - User information with role assignment
   - Email, full name
   - Role: admin, analyst, predictor, team_manager, viewer, demo
   - Active flag, avatar URL, bio
   - Last login tracking

9. **audit_log** - Audit trail for compliance
   - Table name, record ID, action (INSERT/UPDATE/DELETE)
   - User who made change
   - Old and new values (JSONB)
   - Timestamp

10. **feedback** - User feedback on predictions
    - Prediction reference
    - User who submitted
    - Rating (1-5), comment
    - Feedback type: accuracy, relevance, clarity, bug, other

11. **scheduled_jobs** - Background job configuration
    - Job name, type, cron schedule
    - Enabled flag, last run, next run
    - JSONB configuration

12. **job_execution_logs** - Job execution history
    - Job reference
    - Start time, completion time, status
    - Duration, records processed
    - Error tracking

### Indexes

All tables have strategic indexes for:
- Foreign key lookups (league_id, user_id, etc.)
- Common filtering (status, role, is_active)
- Time-based queries (created_at, match_date)
- Composite indexes for frequent query patterns

## RBAC System (Section 2)

### User Roles

| Role | Hierarchy | Permissions | Use Case |
|------|-----------|-------------|----------|
| **admin** | Level 5 | Full system access, user management, all functions | System administrators |
| **analyst** | Level 4 | Read/write all data, create patterns, manage teams | Data analysts, experts |
| **predictor** | Level 3 | Create predictions, analyze matches, view feedback | Prediction creators |
| **team_manager** | Level 2 | Manage team-specific data | Team staff |
| **viewer** | Level 1 | Read-only access to public data | General users |
| **demo** | Level 0 | Limited read-only access | Demo accounts |

### Role Hierarchy

- Admin can perform all operations
- Analyst can do everything predictor can do
- Predictor can create predictions but not manage system
- Viewer can only read public data
- Demo has most restricted access

## Authentication Functions (Section 2)

### Core Functions

1. **get_current_user_id()** - Returns authenticated user ID or NULL
2. **get_user_role(user_id)** - Returns user's role or 'viewer'
3. **is_admin()** - Boolean check for admin role
4. **is_analyst()** - Boolean check for analyst+ roles
5. **is_predictor()** - Boolean check for predictor+ roles
6. **is_service_role()** - Boolean check for backend service role

All functions use `SECURITY DEFINER` to run with elevated privileges for secure checks.

## Computation Functions (Section 3)

### Prediction Functions

1. **calculate_confidence_from_patterns(match_id)** - Aggregates detected patterns to compute overall prediction confidence
2. **update_pattern_accuracy(template_id)** - Calculates accuracy metrics for a pattern based on prediction outcomes
3. **adjust_template_confidence(template_id, adjustment)** - Admin-only function to adjust pattern confidence boost
4. **calculate_team_win_probability(team_id, opponent_id, is_home)** - Calculates win probability using recent form
5. **validate_prediction_data(match_id, outcome, confidence)** - Validates prediction data before insert/update

All functions include proper error handling and return meaningful error messages.

## Trigger Functions (Section 4)

### Trigger Functions

1. **touch_updated_at()** - Automatically updates `updated_at` on record modification
2. **set_created_by()** - Automatically sets `created_by` to current user
3. **handle_new_user()** - Creates user profile when new auth user registers
4. **audit_log_trigger()** - Logs all INSERT/UPDATE/DELETE operations to audit table
5. **validate_prediction_trigger()** - Validates prediction data before insert/update
6. **update_match_status_trigger()** - Automatically marks match as finished when scores set
7. **update_pattern_accuracy_trigger()** - Updates pattern accuracy when prediction evaluated

### Attached Triggers

The following triggers are created and attached to tables:

**Updated At Triggers:**
- `trg_leagues_updated_at`
- `trg_teams_updated_at`
- `trg_matches_updated_at`
- `trg_pattern_templates_updated_at`
- `trg_predictions_updated_at`
- `trg_user_profiles_updated_at`
- `trg_scheduled_jobs_updated_at`
- `trg_feedback_updated_at`

**Created By Triggers:**
- `trg_set_created_by_detected_patterns`
- `trg_set_created_by_predictions`

**Audit Logging Triggers:**
- `trg_audit_leagues`
- `trg_audit_predictions`
- `trg_audit_user_profiles`

**Business Logic Triggers:**
- `trg_validate_prediction`
- `trg_update_match_status`
- `trg_update_pattern_accuracy`
- `on_auth_user_created`

## Row Level Security Policies (Section 6)

### RLS Strategy

The migration implements a comprehensive RLS policy matrix:

1. **Public Read, Admin Write** - Leagues, Pattern Templates, Pattern Accuracy
   - Everyone can read
   - Only admins can create/update

2. **Public Read, Analyst Write** - Teams, Matches, Detected Patterns
   - Everyone can read
   - Analysts+ can create/update

3. **Public Read, Predictor Write** - Predictions
   - Everyone can read
   - Predictors+ can create
   - Creators can update their own

4. **Owner Read, Admin Read All** - User Profiles
   - Users see only their own profile
   - Admins can see all profiles
   - Users can update own (except role)
   - Only admins can create/update roles

5. **Owner Read/Write, Admin Override** - Feedback
   - Users see only their own feedback
   - Admins can see all feedback
   - Users create for themselves

6. **Admin/Service Role Only** - Audit Log, Scheduled Jobs, Job Execution Logs
   - Only admins and service role can access
   - System functions automatically logged

### Policy Details

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| leagues | All | Admin | Admin | - |
| teams | All | Analyst+ | Analyst+ | - |
| matches | All | Analyst+ | Analyst+ | - |
| pattern_templates | All | Admin | Admin | - |
| detected_patterns | All | Analyst+ | Creator/Admin | - |
| predictions | All | Predictor+ | Creator/Admin | - |
| pattern_accuracy | All | Admin | Admin | - |
| user_profiles | Self/Admin | Admin | Self(limited)/Admin | - |
| audit_log | Admin+ | System | - | - |
| feedback | Self/Admin | Self | Self/Admin | - |
| scheduled_jobs | Admin+ | Admin+ | Admin+ | - |
| job_execution_logs | Admin+ | Service | - | - |

## Privilege Grants (Section 7)

### Role Permissions

```sql
-- Authenticated Users (via RLS)
GRANT USAGE ON SCHEMA public TO authenticated
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated

-- Service Role (for backend operations)
GRANT USAGE ON SCHEMA public TO service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role
```

All operations are further restricted by RLS policies at the data level.

## Seed Data (Section 8)

### Initial Data

1. **Pattern Templates** (7 templates)
   - Home Winning Streak
   - Away Winning Streak
   - H2H Dominance
   - Recent Form Advantage
   - High Scoring League
   - Defensive Strength
   - Seasonal Trend

2. **Leagues** (5 leagues)
   - Premier League (England)
   - La Liga (Spain)
   - Serie A (Italy)
   - Bundesliga (Germany)
   - Ligue 1 (France)

3. **Teams** (10 teams)
   - 5 teams per league
   - Includes founded year and league associations

4. **Scheduled Jobs** (4 jobs)
   - Fetch Upcoming Fixtures
   - Run Daily Predictions
   - Update Team Statistics
   - Cleanup Old Logs

## Implementation Notes

### Prerequisites

- PostgreSQL 15+ (Supabase includes this)
- Supabase Auth schema available
- Empty or compatible existing tables

### How It Works

1. **User Registration Flow:**
   - User signs up via auth.users
   - `on_auth_user_created` trigger fires
   - `handle_new_user()` function creates user_profiles record
   - User automatically assigned role (default: viewer)

2. **Prediction Creation Flow:**
   - User calls INSERT on predictions table
   - `set_created_by()` trigger captures user ID
   - `validate_prediction_trigger()` validates data
   - `touch_updated_at()` sets timestamps
   - All RLS policies checked automatically

3. **Audit Trail:**
   - Any data modification triggers `audit_log_trigger()`
   - INSERT/UPDATE/DELETE logged with user and values
   - Accessible only to admins via RLS

4. **Performance:**
   - Strategic indexes on common query patterns
   - Foreign key indexes for joins
   - Partial indexes on boolean flags
   - Composite indexes for frequent multi-column filters

### Production Considerations

1. **Backup:** RLS uses functions - function definitions should be included in backups
2. **Migrations:** Always test in development environment first
3. **Users:** Initial admin users must be created via separate setup migrations
4. **Monitoring:** Monitor `job_execution_logs` for scheduled job health
5. **Audit:** Regularly review `audit_log` for security compliance

### Extending the Schema

To add new tables:

1. Define the table with UUID primary key and timestamps
2. Add CHECK constraints for data validation
3. Create appropriate indexes
4. Add RLS policies (if needed)
5. Create audit trigger if needed
6. Update GRANT statements if new roles access it

## Usage Examples

### Create a Prediction
```sql
-- Requires predictor+ role
INSERT INTO public.predictions (
  match_id, 
  predicted_outcome, 
  confidence_score, 
  predicted_home_score, 
  predicted_away_score
) VALUES (
  'match-uuid'::uuid,
  'home_win',
  75.5,
  2,
  1
);
```

### Check User Role
```sql
SELECT public.get_user_role(auth.uid());

-- If admin:
SELECT public.is_admin(); -- returns true
```

### View Audit Trail (Admin Only)
```sql
SELECT * FROM public.audit_log
WHERE table_name = 'predictions'
ORDER BY created_at DESC
LIMIT 50;
```

### Calculate Pattern Accuracy
```sql
SELECT public.update_pattern_accuracy('pattern-uuid'::uuid);
```

## Performance Metrics

- **Schema:** 12 core tables with ~50 indexes
- **Functions:** 15+ utility and computation functions
- **Triggers:** 20+ triggers for data consistency
- **RLS Policies:** 40+ policies across all tables
- **Seed Data:** ~20 initial records for demo

## Version History

### Version 1.0 (2026-01-20)
- Initial comprehensive migration
- Complete schema with all core entities
- Full RBAC and RLS implementation
- All helper functions and triggers
- Production-ready seed data

## Support & Maintenance

This migration is designed to be:
- **Self-contained:** No dependencies on external migrations
- **Idempotent:** Safe to run multiple times (uses IF NOT EXISTS)
- **Documented:** Extensive comments and this README
- **Tested:** Includes validation functions and checks
- **Extensible:** Easy to add new tables and policies

For updates or modifications, maintain the same structure and naming conventions used throughout this migration.
