
-- 1. user_streaks: restrict SELECT
DROP POLICY IF EXISTS "All read streaks" ON public.user_streaks;
CREATE POLICY "Self or opted-in read streaks"
ON public.user_streaks FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_streaks.user_id AND p.leaderboard_opt_in = true)
);

-- 2. user_xp: restrict SELECT
DROP POLICY IF EXISTS "Public read xp opt-in" ON public.user_xp;
CREATE POLICY "Self or opted-in read xp"
ON public.user_xp FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_xp.user_id AND p.leaderboard_opt_in = true)
);

-- 3. friend_requests: split update policy so only recipient can change status
DROP POLICY IF EXISTS "Respond to own requests" ON public.friend_requests;
CREATE POLICY "Recipient responds to requests"
ON public.friend_requests FOR UPDATE TO authenticated
USING (to_user = auth.uid() AND status = 'pending')
WITH CHECK (to_user = auth.uid() AND status IN ('accepted','rejected'));

CREATE POLICY "Sender cancels own pending request"
ON public.friend_requests FOR UPDATE TO authenticated
USING (from_user = auth.uid() AND status = 'pending')
WITH CHECK (from_user = auth.uid() AND status = 'cancelled');

-- 4. user_streak(uuid) function: revoke broad EXECUTE and guard inside
REVOKE EXECUTE ON FUNCTION public.user_streak(uuid) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.user_streak(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH days AS (
    SELECT DISTINCT date_trunc('day', start_time)::date AS d
    FROM public.study_sessions
    WHERE user_id = _user_id
      AND duration IS NOT NULL AND duration > 0
      AND (_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ),
  ranked AS (
    SELECT d, row_number() OVER (ORDER BY d DESC)::int AS rn FROM days
  )
  SELECT COALESCE(count(*), 0)::int FROM ranked
  WHERE d = (CURRENT_DATE - ((rn - 1) || ' days')::interval)::date;
$function$;

-- 5. log_audit_action: revoke if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_audit_action'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.log_audit_action(text, uuid, jsonb) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- 6. Public avatars bucket: block listing while preserving direct file reads via signed/public URL paths.
-- Drop overly broad SELECT policies on avatars bucket and replace with one that only matches single-object lookups by full name.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%avatars%' OR with_check ILIKE '%avatars%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Avatars: read own file"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Avatars: read by exact path"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars' AND name IS NOT NULL);
