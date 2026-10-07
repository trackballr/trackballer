-- Profile history pages: one keyset-paged feed over match + career ratings,
-- plus per-user indexes so ratings and comments page by recency cheaply.

CREATE INDEX IF NOT EXISTS match_ratings_user_updated_idx
  ON public.match_ratings (user_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS career_ratings_user_updated_idx
  ON public.career_ratings (user_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS comments_user_created_idx
  ON public.comments (user_id, created_at DESC, id DESC)
  WHERE is_deleted = false;

-- Newest first by updated_at, so a re-rated player moves back to the top.
-- Cursor is the last row's (rated_at, kind, id); pass all three or none.
-- SECURITY INVOKER: both rating tables are already public-read under RLS.
CREATE OR REPLACE FUNCTION public.get_user_rating_history(
  p_user_id uuid,
  p_kind text DEFAULT NULL,
  p_before_at timestamptz DEFAULT NULL,
  p_before_kind text DEFAULT NULL,
  p_before_id bigint DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  kind text,
  id bigint,
  player_id bigint,
  fixture_id bigint,
  value numeric,
  rated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.kind, r.id, r.player_id, r.fixture_id, r.value, r.rated_at
  FROM (
    SELECT 'match'::text AS kind, mr.id, mr.player_id, mr.fixture_id, mr.value, mr.updated_at AS rated_at
    FROM public.match_ratings mr
    WHERE mr.user_id = p_user_id
      AND (p_kind IS NULL OR p_kind = 'match')
    UNION ALL
    SELECT 'career'::text, cr.id, cr.player_id, NULL::bigint, cr.value, cr.updated_at
    FROM public.career_ratings cr
    WHERE cr.user_id = p_user_id
      AND (p_kind IS NULL OR p_kind = 'career')
  ) r
  WHERE p_before_at IS NULL
     OR (r.rated_at, r.kind, r.id) < (p_before_at, p_before_kind, p_before_id)
  ORDER BY r.rated_at DESC, r.kind DESC, r.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_user_rating_history(uuid, text, timestamptz, text, bigint, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_rating_history(uuid, text, timestamptz, text, bigint, integer) TO anon, authenticated;
