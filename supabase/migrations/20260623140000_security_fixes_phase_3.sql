-- Phase 3 security fixes (breachlist F-3, F-1b)
-- Deploy app code that re-points readers/writers before applying this migration.

-- ---------------------------------------------------------------------------
-- F-3: definer helpers for columns we will revoke from direct SELECT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_profile_twitter_verified_at(p_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT twitter_verified_at FROM public.profiles WHERE id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_profile_twitter_verified_at(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_twitter_verified_at(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE (date_of_birth date, location text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT date_of_birth, location FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_private_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;

-- Comment insert policy: stop inlining is_banned column read (revoked below)
DROP POLICY IF EXISTS comments_insert_auth ON public.comments;

CREATE POLICY comments_insert_auth ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND NOT (SELECT public.is_banned())
  );

-- ---------------------------------------------------------------------------
-- F-3: revoke direct read of private profile columns
-- ---------------------------------------------------------------------------
REVOKE SELECT (date_of_birth, location, is_admin, is_banned, twitter_verified_at)
  ON public.profiles FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- F-1b: revoke direct write of server-controlled profile columns
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
    IF NEW.onboarding_completed_at IS DISTINCT FROM OLD.onboarding_completed_at THEN
      RAISE EXCEPTION 'onboarding_completed_at cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
    IF NEW.twitter_verified_at IS DISTINCT FROM OLD.twitter_verified_at THEN
      RAISE EXCEPTION 'twitter_verified_at cannot be modified by this role' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE UPDATE (onboarding_completed_at, twitter_verified_at) ON public.profiles FROM anon, authenticated;
