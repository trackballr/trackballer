-- Home shuffle: top-5 league squads only (PL, La Liga, Serie A, Bundesliga, Ligue 1).
-- League ids match lib/catalog-sync/seed-top-league-clubs.ts TOP_LEAGUE_CLUBS.

CREATE OR REPLACE FUNCTION public.get_shuffle_career_player()
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
  INNER JOIN LATERAL (
    SELECT pss.team_id
    FROM public.player_season_squads pss
    INNER JOIN public.seasons s ON s.id = pss.season_id
    CROSS JOIN latest_top_league_year lty
    WHERE pss.player_id = p.id
      AND s.league_id IN (39, 140, 135, 78, 61)
      AND lty.year IS NOT NULL
      AND s.year = lty.year
    LIMIT 1
  ) squad ON true
  LEFT JOIN public.teams t ON t.id = squad.team_id
  LEFT JOIN public.player_career_aggregates pca ON pca.player_id = p.id
  WHERE p.photo_url IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.career_ratings cr
      WHERE cr.player_id = p.id
        AND cr.user_id = auth.uid()
    )
  ORDER BY random()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shuffle_career_player() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shuffle_career_player() TO authenticated;
