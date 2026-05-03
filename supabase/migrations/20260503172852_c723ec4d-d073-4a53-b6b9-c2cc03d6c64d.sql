
-- 1. study_sessions: add WITH CHECK to prevent user_id transfer
DROP POLICY IF EXISTS "Users update own sessions" ON public.study_sessions;
CREATE POLICY "Users update own sessions"
  ON public.study_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. rooms: prevent created_by mutation via trigger
CREATE OR REPLACE FUNCTION public.prevent_rooms_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Room ownership cannot be transferred';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rooms_prevent_owner_change ON public.rooms;
CREATE TRIGGER rooms_prevent_owner_change
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.prevent_rooms_owner_change();

-- 3. room_members: prevent removed members from updating their row
DROP POLICY IF EXISTS "Members can leave or stay active" ON public.room_members;
CREATE POLICY "Members can leave or stay active"
  ON public.room_members FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status <> 'removed')
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('active', 'left')
  );

-- 4. profiles: prevent email mutation from client (trigger keeps it immutable here;
-- email is owned by auth.users and synced via handle_new_user)
CREATE OR REPLACE FUNCTION public.prevent_profile_email_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_email_change ON public.profiles;
CREATE TRIGGER profiles_prevent_email_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_email_change();

-- Add WITH CHECK to profiles update
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. audit_logs: remove open insert policy; only SECURITY DEFINER / service role can insert
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
