ALTER VIEW public.leaderboard_weekly SET (security_invoker = on);
ALTER VIEW public.leaderboard_alltime SET (security_invoker = on);
ALTER VIEW public.leaderboard_xp_alltime SET (security_invoker = on);
ALTER VIEW public.leaderboard_xp_weekly SET (security_invoker = on);

ALTER FUNCTION public.xp_required_for_level(int) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.recalc_level(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, text, int, uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_badge(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_streak(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_users(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated;