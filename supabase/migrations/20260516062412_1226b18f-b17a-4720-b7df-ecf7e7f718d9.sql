
DROP FUNCTION IF EXISTS public.search_users(text);
CREATE OR REPLACE FUNCTION public.search_users(_q text)
RETURNS TABLE(id uuid, name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.name, p.avatar_url
  FROM public.profiles p
  WHERE p.name ILIKE _q || '%'
    AND p.id <> auth.uid()
    AND p.status = 'active'
  LIMIT 20;
$$;
REVOKE EXECUTE ON FUNCTION public.search_users(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT (
    (auth.uid() = _a OR auth.uid() = _b)
    AND EXISTS (
      SELECT 1 FROM public.friends
      WHERE user_a = LEAST(_a,_b) AND user_b = GREATEST(_a,_b)
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_streak(uuid) FROM PUBLIC, anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_audit_action'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.log_audit_action FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

DROP POLICY IF EXISTS "Participants mark read" ON public.dm_messages;

CREATE POLICY "Recipient marks message read"
  ON public.dm_messages FOR UPDATE TO authenticated
  USING (
    user_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.dm_threads t
      WHERE t.id = dm_messages.thread_id
        AND (t.user_a = auth.uid() OR t.user_b = auth.uid()))
  )
  WITH CHECK (
    user_id <> auth.uid()
    AND EXISTS (SELECT 1 FROM public.dm_threads t
      WHERE t.id = dm_messages.thread_id
        AND (t.user_a = auth.uid() OR t.user_b = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.dm_messages_freeze_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at may be updated on dm_messages';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dm_messages_freeze_immutable_trg ON public.dm_messages;
CREATE TRIGGER dm_messages_freeze_immutable_trg
  BEFORE UPDATE ON public.dm_messages
  FOR EACH ROW EXECUTE FUNCTION public.dm_messages_freeze_immutable();
