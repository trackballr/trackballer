-- Phase 1 + 2 security fixes (breachlist F-6, F-4, F-5, F-1, F-2)
-- Order: least-coupled first.

-- ---------------------------------------------------------------------------
-- F-6: re-REVOKE recompute/refresh RPCs (CREATE OR REPLACE reset ACLs)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.recompute_player_career_aggregate(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_match_aggregate(bigint, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_form_snapshot(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_player_tournament_aggregate(bigint, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_comment_vote_counts(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.init_player_career_aggregate() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- F-4: match_ratings UPDATE must mirror INSERT rateable/unlocked gates
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS match_ratings_update_own ON public.match_ratings;

CREATE POLICY match_ratings_update_own ON public.match_ratings
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.fixtures f
      WHERE f.id = match_ratings.fixture_id
        AND f.ratings_unlocked_at IS NOT NULL
    )
    AND EXISTS (
      SELECT 1
      FROM public.fixture_appearances fa
      WHERE fa.fixture_id = match_ratings.fixture_id
        AND fa.player_id = match_ratings.player_id
        AND fa.is_rateable = true
    )
  );

-- ---------------------------------------------------------------------------
-- F-5: banned users cannot edit comments; non-admins cannot resurrect soft-deletes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_banned = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_banned() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_banned() TO authenticated;

DROP POLICY IF EXISTS comments_update_own ON public.comments;

CREATE POLICY comments_update_own ON public.comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
  WITH CHECK (
    ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
    AND ((SELECT public.is_admin()) OR NOT (SELECT public.is_banned()))
  );

CREATE OR REPLACE FUNCTION public.comments_guard_undelete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_deleted = true AND NEW.is_deleted = false AND NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'cannot resurrect a deleted comment' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_guard_undelete ON public.comments;
CREATE TRIGGER comments_guard_undelete
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.comments_guard_undelete();

-- ---------------------------------------------------------------------------
-- F-1 + F-2: block self-assign is_admin / self-clear is_banned
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'is_admin cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
    IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'is_banned cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_privileged_columns();

REVOKE UPDATE (is_admin, is_banned) ON public.profiles FROM anon, authenticated;
