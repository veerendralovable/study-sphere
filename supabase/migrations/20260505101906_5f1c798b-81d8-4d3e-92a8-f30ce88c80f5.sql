
-- =========================================================
-- 1. SCHEMA ADDITIONS
-- =========================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS room_name_snapshot text;

-- =========================================================
-- 2. NEW TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.daily_goals (
  user_id uuid PRIMARY KEY,
  goal_seconds int NOT NULL DEFAULT 7200 CHECK (goal_seconds > 0 AND goal_seconds <= 86400),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own goals" ON public.daily_goals;
CREATE POLICY "Users manage own goals" ON public.daily_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all goals" ON public.daily_goals;
CREATE POLICY "Admins read all goals" ON public.daily_goals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins read all notifications" ON public.notifications;
CREATE POLICY "Admins read all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','admins')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All read active announcements" ON public.announcements;
CREATE POLICY "All read active announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    (expires_at IS NULL OR expires_at > now())
    AND (audience = 'all' OR public.has_role(auth.uid(), 'admin'))
  );
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON public.room_messages(room_id, created_at DESC);
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read messages" ON public.room_messages;
CREATE POLICY "Members read messages" ON public.room_messages
  FOR SELECT TO authenticated
  USING (public.is_room_member(auth.uid(), room_id));
DROP POLICY IF EXISTS "Members post messages" ON public.room_messages;
CREATE POLICY "Members post messages" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_room_member(auth.uid(), room_id));
DROP POLICY IF EXISTS "Author or creator deletes messages" ON public.room_messages;
CREATE POLICY "Author or creator deletes messages" ON public.room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_room_creator(auth.uid(), room_id) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.presence_pings (
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
ALTER TABLE public.presence_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read presence" ON public.presence_pings;
CREATE POLICY "Members read presence" ON public.presence_pings
  FOR SELECT TO authenticated
  USING (public.is_room_member(auth.uid(), room_id));
DROP POLICY IF EXISTS "Users write own presence" ON public.presence_pings;
CREATE POLICY "Users write own presence" ON public.presence_pings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_room_member(auth.uid(), room_id));
DROP POLICY IF EXISTS "Users update own presence" ON public.presence_pings;
CREATE POLICY "Users update own presence" ON public.presence_pings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 3. PROFILES UPDATE POLICY SPLIT
-- =========================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users update own profile fields" ON public.profiles;
CREATE POLICY "Users update own profile fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_profile_status_change_by_self()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_status_guard ON public.profiles;
CREATE TRIGGER trg_profile_status_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_status_change_by_self();

-- =========================================================
-- 4. ROOM_MEMBERS UPDATE POLICY SPLIT
-- =========================================================

DROP POLICY IF EXISTS "Members can leave or stay active" ON public.room_members;

DROP POLICY IF EXISTS "Self can leave room" ON public.room_members;
CREATE POLICY "Self can leave room" ON public.room_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'active')
  WITH CHECK (auth.uid() = user_id AND status = 'left');

DROP POLICY IF EXISTS "Self can rejoin if not removed" ON public.room_members;
CREATE POLICY "Self can rejoin if not removed" ON public.room_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'left')
  WITH CHECK (auth.uid() = user_id AND status = 'active');

-- =========================================================
-- 5. AUDIT TRIGGERS
-- =========================================================

CREATE OR REPLACE FUNCTION public.audit_room_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
  VALUES ('room_deleted', 'room', OLD.id, COALESCE(auth.uid(), OLD.created_by),
          jsonb_build_object('name', OLD.name, 'is_private', OLD.is_private));
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_room_delete ON public.rooms;
CREATE TRIGGER trg_audit_room_delete
  AFTER DELETE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.audit_room_delete();

CREATE OR REPLACE FUNCTION public.audit_member_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
    VALUES ('member_status_changed', 'room_member', NEW.id, auth.uid(),
            jsonb_build_object('room_id', NEW.room_id, 'user_id', NEW.user_id, 'from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_member_status ON public.room_members;
CREATE TRIGGER trg_audit_member_status
  AFTER UPDATE ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_member_status();

CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
    VALUES ('role_granted', 'user', NEW.user_id, auth.uid(), jsonb_build_object('role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
    VALUES ('role_revoked', 'user', OLD.user_id, auth.uid(), jsonb_build_object('role', OLD.role));
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.user_roles;
CREATE TRIGGER trg_audit_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();

CREATE OR REPLACE FUNCTION public.audit_exam_mode()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.exam_mode IS DISTINCT FROM OLD.exam_mode THEN
    INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
    VALUES ('exam_mode_toggled', 'room', NEW.id, auth.uid(),
            jsonb_build_object('value', NEW.exam_mode));
  END IF;
  IF NEW.locked IS DISTINCT FROM OLD.locked THEN
    INSERT INTO public.audit_logs(action, target_type, target_id, actor_id, metadata)
    VALUES ('room_lock_toggled', 'room', NEW.id, auth.uid(),
            jsonb_build_object('locked', NEW.locked));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_exam_mode ON public.rooms;
CREATE TRIGGER trg_audit_exam_mode
  AFTER UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.audit_exam_mode();

-- =========================================================
-- 6. STALE SESSIONS + LAST ACTIVE
-- =========================================================

CREATE OR REPLACE FUNCTION public.bump_last_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_bump_last_active ON public.study_sessions;
CREATE TRIGGER trg_bump_last_active
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.bump_last_active();

CREATE OR REPLACE FUNCTION public.auto_close_stale_sessions()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  WITH updated AS (
    UPDATE public.study_sessions
    SET end_time = start_time + interval '6 hours',
        duration = 6 * 3600
    WHERE end_time IS NULL
      AND start_time < now() - interval '6 hours'
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM updated;
  RETURN v_count;
END; $$;

REVOKE EXECUTE ON FUNCTION public.auto_close_stale_sessions() FROM PUBLIC, anon;

-- =========================================================
-- 7. user_streak helper (fixed cast)
-- =========================================================

CREATE OR REPLACE FUNCTION public.user_streak(_user_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH days AS (
    SELECT DISTINCT date_trunc('day', start_time)::date AS d
    FROM public.study_sessions
    WHERE user_id = _user_id AND duration IS NOT NULL AND duration > 0
  ),
  ranked AS (
    SELECT d, row_number() OVER (ORDER BY d DESC)::int AS rn FROM days
  )
  SELECT COALESCE(count(*), 0)::int FROM ranked
  WHERE d = (CURRENT_DATE - ((rn - 1) || ' days')::interval)::date;
$$;

-- =========================================================
-- 8. SEED system_settings
-- =========================================================

INSERT INTO public.system_settings (key, value, description) VALUES
  ('max_room_size','50','Maximum members per room'),
  ('max_rooms_per_user','10','Maximum rooms a user can own'),
  ('allowed_domains','["edu"]','Allowed email domain suffixes (JSON array)'),
  ('maintenance_mode','false','When true, non-admins see a maintenance screen'),
  ('timer_min_duration','60','Minimum timer duration in seconds'),
  ('timer_max_duration','14400','Maximum timer duration in seconds (4h)'),
  ('default_daily_goal_seconds','7200','Default daily study goal in seconds'),
  ('feature_chat','true','In-room chat enabled'),
  ('feature_announcements','true','Admin announcements enabled')
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- 9. STORAGE: avatars bucket
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =========================================================
-- 10. REALTIME PUBLICATION
-- =========================================================

ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.presence_pings REPLICA IDENTITY FULL;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages';
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements';
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_pings';
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
