-- UEFA Champions League hub (API-Football league id 2).

INSERT INTO public.leagues (id, name, slug, country, logo_url, is_active)
VALUES (2, 'UEFA Champions League', 'champions-league', 'Europe', NULL, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  country = EXCLUDED.country;
