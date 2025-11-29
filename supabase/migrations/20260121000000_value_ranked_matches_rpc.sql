-- Migration: 20260121000000 Value Ranked Matches RPC Function
-- Description: Creates an RPC function to rank matches by "Value Score" (Value Betting)
-- incorporating expected goals and BTTS probability

-- Calculate value score based on:
-- Value Score = (Home_xG + Away_xG) + (BTTS_Probability * 1.5)
-- This prioritizes high-scoring and Both Teams Score matches

CREATE OR REPLACE FUNCTION public.get_value_ranked_matches(
  p_match_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  league_id uuid,
  home_team_id uuid,
  away_team_id uuid,
  home_team_name text,
  away_team_name text,
  league_name text,
  scheduled_at timestamptz,
  status public.match_status,
  home_score smallint,
  away_score smallint,
  home_xg numeric,
  away_xg numeric,
  btts_probability numeric,
  value_score numeric,
  is_featured boolean
) AS $$
DECLARE
  v_total_matches int;
BEGIN
  -- Calculate xG and BTTS values from predictions, then rank by value score
  RETURN QUERY
  WITH ranked_matches AS (
    SELECT
      m.id,
      m.league_id,
      m.home_team_id,
      m.away_team_id,
      ht.name as home_team_name,
      at.name as away_team_name,
      l.name as league_name,
      m.scheduled_at,
      m.status,
      m.home_score,
      m.away_score,
      -- Extract home_xg from predictions metadata or ensemble_breakdown
      COALESCE(
        (p_max.metadata->>'home_xg')::numeric,
        CAST((p_max.ensemble_breakdown->>'home_xg') AS numeric),
        1.5
      ) as home_xg,
      -- Extract away_xg from predictions metadata or ensemble_breakdown
      COALESCE(
        (p_max.metadata->>'away_xg')::numeric,
        CAST((p_max.ensemble_breakdown->>'away_xg') AS numeric),
        1.5
      ) as away_xg,
      -- Calculate BTTS probability from user_predictions or predictions
      COALESCE(
        (
          SELECT CAST(COUNT(*) FILTER (WHERE btts_prediction = true) AS numeric) / 
                 NULLIF(COUNT(*), 0) * 100
          FROM public.user_predictions
          WHERE match_id = m.id
        ),
        (
          SELECT AVG(win_probability) 
          FROM public.predictions 
          WHERE match_id = m.id AND status = 'locked'
        ),
        30.0
      ) as btts_probability,
      -- Value Score = (Home_xG + Away_xG) + (BTTS_Probability * 1.5)
      COALESCE(
        (p_max.metadata->>'home_xg')::numeric,
        CAST((p_max.ensemble_breakdown->>'home_xg') AS numeric),
        1.5
      ) +
      COALESCE(
        (p_max.metadata->>'away_xg')::numeric,
        CAST((p_max.ensemble_breakdown->>'away_xg') AS numeric),
        1.5
      ) +
      (
        COALESCE(
          (
            SELECT CAST(COUNT(*) FILTER (WHERE btts_prediction = true) AS numeric) / 
                   NULLIF(COUNT(*), 0) * 100
            FROM public.user_predictions
            WHERE match_id = m.id
          ),
          (
            SELECT AVG(win_probability) 
            FROM public.predictions 
            WHERE match_id = m.id AND status = 'locked'
          ),
          30.0
        ) * 1.5
      ) as value_score
    FROM public.matches m
    LEFT JOIN public.teams ht ON m.home_team_id = ht.id
    LEFT JOIN public.teams at ON m.away_team_id = at.id
    LEFT JOIN public.leagues l ON m.league_id = l.id
    LEFT JOIN LATERAL (
      SELECT *
      FROM public.predictions
      WHERE match_id = m.id
      ORDER BY created_at DESC
      LIMIT 1
    ) p_max ON true
    WHERE m.id = ANY(p_match_ids)
  )
  SELECT
    rm.id,
    rm.league_id,
    rm.home_team_id,
    rm.away_team_id,
    rm.home_team_name,
    rm.away_team_name,
    rm.league_name,
    rm.scheduled_at,
    rm.status,
    rm.home_score,
    rm.away_score,
    rm.home_xg,
    rm.away_xg,
    rm.btts_probability,
    rm.value_score,
    -- Mark top 2 matches as featured
    ROW_NUMBER() OVER (ORDER BY rm.value_score DESC) <= 2 as is_featured
  FROM ranked_matches rm
  ORDER BY rm.value_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_value_ranked_matches(uuid[]) IS 
'Returns matches ranked by Value Score for Value Betting feature.
Value Score = (Home_xG + Away_xG) + (BTTS_Probability * 1.5)
Top 2 matches marked with is_featured = true.';
