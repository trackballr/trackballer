-- Home shuffle can narrow to one top-5 league and an optional club list.
-- Invalid league ids return no row. Null or empty club ids mean every club in scope.

DROP FUNCTION IF EXISTS public.get_shuffle_career_player();

CREATE FUNCTION public.get_shuffle_career_player(
  p_league_id bigint DEFAULT NULL,
  p_team_ids bigint[] DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  name text,
  firstname text,
  lastname text,
  photo_url text,
  primary_position text,
  club_name text,
  display_score numeric,
  tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_top_league_year AS (
    SELECT MAX(s.year) AS year
    FROM public.seasons s
    WHERE s.league_id IN (39, 140, 135, 78, 61)
  ),
  fixture_clubs AS (
    SELECT DISTINCT f.home_team_id AS team_id
    FROM public.fixtures f
    INNER JOIN public.seasons s ON s.id = f.season_id
    CROSS JOIN latest_top_league_year lty
    WHERE s.league_id IN (39, 140, 135, 78, 61)
      AND lty.year IS NOT NULL
      AND s.year = lty.year
      AND (p_league_id IS NULL OR s.league_id = p_league_id)
    UNION
    SELECT DISTINCT f.away_team_id
    FROM public.fixtures f
    INNER JOIN public.seasons s ON s.id = f.season_id
    CROSS JOIN latest_top_league_year lty
    WHERE s.league_id IN (39, 140, 135, 78, 61)
      AND lty.year IS NOT NULL
      AND s.year = lty.year
      AND (p_league_id IS NULL OR s.league_id = p_league_id)
  ),
  pool AS (
    SELECT DISTINCT pss.player_id, pss.team_id
    FROM public.player_season_squads pss
    INNER JOIN public.seasons s ON s.id = pss.season_id
    CROSS JOIN latest_top_league_year lty
    WHERE s.league_id IN (39, 140, 135, 78, 61)
      AND lty.year IS NOT NULL
      AND s.year = lty.year
      AND (p_league_id IS NULL OR s.league_id = p_league_id)
      AND (
        p_team_ids IS NULL
        OR cardinality(p_team_ids) = 0
        OR pss.team_id = ANY (p_team_ids)
      )

    UNION

    SELECT DISTINCT p.id AS player_id, p.club_team_id AS team_id
    FROM public.players p
    INNER JOIN fixture_clubs fc ON fc.team_id = p.club_team_id
    WHERE p.club_team_id IS NOT NULL
      AND (
        p_team_ids IS NULL
        OR cardinality(p_team_ids) = 0
        OR p.club_team_id = ANY (p_team_ids)
      )
  )
  SELECT
    p.id,
    p.name,
    p.firstname,
    p.lastname,
    p.photo_url,
    p.primary_position,
    t.name AS club_name,
    coalesce(pca.display_score, 50)::numeric AS display_score,
    coalesce(pca.tier, 'provisional') AS tier
  FROM public.players p
  INNER JOIN pool ON pool.player_id = p.id
  LEFT JOIN public.teams t ON t.id = pool.team_id
  LEFT JOIN public.player_career_aggregates pca ON pca.player_id = p.id
  WHERE p.photo_url IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND (p_league_id IS NULL OR p_league_id IN (39, 140, 135, 78, 61))
    AND NOT EXISTS (
      SELECT 1
      FROM public.career_ratings cr
      WHERE cr.player_id = p.id
        AND cr.user_id = auth.uid()
    )
  ORDER BY random()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shuffle_career_player(bigint, bigint[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shuffle_career_player(bigint, bigint[]) TO authenticated;
