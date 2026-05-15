-- =========================================================================
-- StudyStream feature foundation (Clusters 9-12)
-- =========================================================================

-- ---------- 9.1 Pomodoro presets + room program ---------------------------
CREATE TABLE IF NOT EXISTS public.pomodoro_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  focus_min int NOT NULL DEFAULT 25,
  short_break_min int NOT NULL DEFAULT 5,
  long_break_min int NOT NULL DEFAULT 15,
  cycles_until_long int NOT NULL DEFAULT 4,
  auto_start boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pomodoro_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read system or own presets" ON public.pomodoro_presets
  FOR SELECT TO authenticated
  USING (is_system = true OR user_id = auth.uid());
CREATE POLICY "Manage own presets" ON public.pomodoro_presets
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

INSERT INTO public.pomodoro_presets (name, focus_min, short_break_min, long_break_min, cycles_until_long, is_system)
VALUES
  ('Classic 25/5', 25, 5, 15, 4, true),
  ('Long 50/10', 50, 10, 20, 3, true),
  ('Ultradian 90/20', 90, 20, 30, 2, true),
  ('Deep 120/30', 120, 30, 30, 2, true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.room_timer_program (
  room_id uuid PRIMARY KEY,
  preset_id uuid NOT NULL REFERENCES public.pomodoro_presets(id),
  current_phase text NOT NULL DEFAULT 'focus' CHECK (current_phase IN ('focus','short_break','long_break')),
  cycle_index int NOT NULL DEFAULT 0,
  phase_started_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.room_timer_program ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read program" ON public.room_timer_program
  FOR SELECT TO authenticated USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Members upsert program" ON public.room_timer_program
  FOR INSERT TO authenticated WITH CHECK (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Members update program" ON public.room_timer_program
  FOR UPDATE TO authenticated USING (public.is_room_member(auth.uid(), room_id))
  WITH CHECK (public.is_room_member(auth.uid(), room_id));

-- ---------- 9.2 Session tasks ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid,
  room_id uuid,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  est_pomodoros int NOT NULL DEFAULT 1,
  actual_pomodoros int NOT NULL DEFAULT 0,
  is_focus boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.session_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self read tasks" ON public.session_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Room members read tasks" ON public.session_tasks FOR SELECT TO authenticated
  USING (room_id IS NOT NULL AND public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Self insert tasks" ON public.session_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Self update tasks" ON public.session_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Self delete tasks" ON public.session_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- 9.3 Focus blocklists ------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_blocklists (
  user_id uuid PRIMARY KEY,
  items text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.focus_blocklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self manage blocklist" ON public.focus_blocklists FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 9.4 Notes & reflections ---------------------------------------
CREATE TABLE IF NOT EXISTS public.session_notes (
  session_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self manage notes" ON public.session_notes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.session_reflections (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  mood int CHECK (mood BETWEEN 1 AND 5),
  productivity int CHECK (productivity BETWEEN 1 AND 5),
  accomplished text,
  next_steps text,
  friction text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.session_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self manage reflections" ON public.session_reflections FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 9.5 Sound mixes & focus tracks --------------------------------
CREATE TABLE IF NOT EXISTS public.user_sound_mixes (
  user_id uuid PRIMARY KEY,
  mix jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_sound_mixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self manage mix" ON public.user_sound_mixes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.focus_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  storage_path text NOT NULL,
  duration_seconds int,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.focus_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read tracks" ON public.focus_tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage tracks" ON public.focus_tracks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- 10.1 XP / Levels / Badges / Streaks ---------------------------
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id uuid PRIMARY KEY,
  xp bigint NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  level_progress int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read xp opt-in" ON public.user_xp FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  amount int NOT NULL,
  ref_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self read xp events" ON public.xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read xp events" ON public.xp_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.badges (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text,
  tier text NOT NULL DEFAULT 'bronze',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.badges (code, name, description, icon, tier, criteria) VALUES
  ('first_session','First Session','Complete your first study session','sparkles','bronze','{}'),
  ('night_owl','Night Owl','Study between midnight and 4am','moon','silver','{}'),
  ('early_bird','Early Bird','Study between 5am and 8am','sunrise','silver','{}'),
  ('marathon','Marathon','Single session of 4 hours+','trophy','gold','{}'),
  ('centurion','Centurion','Complete 100 sessions','shield','gold','{}'),
  ('streak_3','Streak Starter','3-day streak','flame','bronze','{}'),
  ('streak_7','Streak Keeper','7-day streak','flame','silver','{}'),
  ('streak_30','Streak Hero','30-day streak','flame','gold','{}'),
  ('streak_100','Streak Legend','100-day streak','flame','platinum','{}'),
  ('social_butterfly','Social Butterfly','Connect with 5 friends','users','silver','{}'),
  ('focus_master','Focus Master','50 completed pomodoros','target','gold','{}')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL,
  badge_code text NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_code)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read user badges" ON public.user_badges FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY,
  current int NOT NULL DEFAULT 0,
  longest int NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read streaks" ON public.user_streaks FOR SELECT TO authenticated USING (true);

-- XP / level helpers
CREATE OR REPLACE FUNCTION public.xp_required_for_level(_level int)
RETURNS bigint LANGUAGE sql IMMUTABLE AS $$
  SELECT (100 * power(_level, 1.5))::bigint;
$$;

CREATE OR REPLACE FUNCTION public.recalc_level(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_xp bigint;
  v_level int := 1;
  v_required bigint;
BEGIN
  SELECT xp INTO v_xp FROM public.user_xp WHERE user_id = _user_id;
  IF v_xp IS NULL THEN RETURN; END IF;
  LOOP
    v_required := public.xp_required_for_level(v_level);
    EXIT WHEN v_xp < v_required;
    v_xp := v_xp - v_required;
    v_level := v_level + 1;
    EXIT WHEN v_level > 200;
  END LOOP;
  UPDATE public.user_xp
    SET level = v_level, level_progress = v_xp::int, updated_at = now()
    WHERE user_id = _user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _source text, _amount int, _ref_id uuid DEFAULT NULL, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _amount <= 0 THEN RETURN; END IF;
  INSERT INTO public.user_xp(user_id, xp) VALUES (_user_id, _amount)
    ON CONFLICT (user_id) DO UPDATE SET xp = public.user_xp.xp + _amount, updated_at = now();
  INSERT INTO public.xp_events(user_id, source, amount, ref_id, metadata)
    VALUES (_user_id, _source, _amount, _ref_id, _meta);
  PERFORM public.recalc_level(_user_id);
END; $$;

CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_badges(user_id, badge_code) VALUES (_user_id, _code)
    ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.bump_streak(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_row public.user_streaks%ROWTYPE;
  v_new_current int;
BEGIN
  SELECT * INTO v_row FROM public.user_streaks WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks(user_id, current, longest, last_active_date)
      VALUES (_user_id, 1, 1, v_today);
    v_new_current := 1;
  ELSIF v_row.last_active_date = v_today THEN
    RETURN;
  ELSIF v_row.last_active_date = v_today - 1 THEN
    v_new_current := v_row.current + 1;
    UPDATE public.user_streaks SET current = v_new_current,
      longest = GREATEST(longest, v_new_current),
      last_active_date = v_today, updated_at = now()
      WHERE user_id = _user_id;
  ELSE
    v_new_current := 1;
    UPDATE public.user_streaks SET current = 1, last_active_date = v_today, updated_at = now()
      WHERE user_id = _user_id;
  END IF;
  IF v_new_current = 3 THEN PERFORM public.award_badge(_user_id,'streak_3');
  ELSIF v_new_current = 7 THEN PERFORM public.award_badge(_user_id,'streak_7');
  ELSIF v_new_current = 30 THEN PERFORM public.award_badge(_user_id,'streak_30');
  ELSIF v_new_current = 100 THEN PERFORM public.award_badge(_user_id,'streak_100');
  END IF;
END; $$;

-- Trigger: on session end -> award XP + streak + first-session/marathon/night-owl/early-bird badges
CREATE OR REPLACE FUNCTION public.on_session_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_minutes int; v_hour int;
BEGIN
  IF NEW.duration IS NULL OR (OLD.duration IS NOT NULL AND OLD.duration = NEW.duration) THEN
    RETURN NEW;
  END IF;
  IF NEW.duration <= 0 THEN RETURN NEW; END IF;
  v_minutes := NEW.duration / 60;
  PERFORM public.award_xp(NEW.user_id, 'session', GREATEST(v_minutes,1), NEW.id);
  PERFORM public.bump_streak(NEW.user_id);
  -- First session
  PERFORM public.award_badge(NEW.user_id,'first_session');
  -- Marathon
  IF NEW.duration >= 4*3600 THEN PERFORM public.award_badge(NEW.user_id,'marathon'); END IF;
  -- Night owl / early bird based on local-ish UTC start hour
  v_hour := EXTRACT(HOUR FROM NEW.start_time)::int;
  IF v_hour < 4 THEN PERFORM public.award_badge(NEW.user_id,'night_owl');
  ELSIF v_hour BETWEEN 5 AND 7 THEN PERFORM public.award_badge(NEW.user_id,'early_bird');
  END IF;
  -- Centurion
  IF (SELECT count(*) FROM public.study_sessions WHERE user_id = NEW.user_id AND duration > 0) >= 100 THEN
    PERFORM public.award_badge(NEW.user_id,'centurion');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_on_session_completed ON public.study_sessions;
CREATE TRIGGER trg_on_session_completed
AFTER UPDATE ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.on_session_completed();

-- Trigger: on task done -> award XP
CREATE OR REPLACE FUNCTION public.on_task_done()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_amt int;
BEGIN
  IF NEW.done = true AND (OLD.done IS DISTINCT FROM true) THEN
    v_amt := 5;
    IF NEW.actual_pomodoros = NEW.est_pomodoros AND NEW.est_pomodoros > 0 THEN v_amt := v_amt + 15; END IF;
    PERFORM public.award_xp(NEW.user_id, 'task', v_amt, NEW.id);
    NEW.completed_at := now();
    -- Focus master
    IF (SELECT count(*) FROM public.session_tasks WHERE user_id = NEW.user_id AND done = true) >= 50 THEN
      PERFORM public.award_badge(NEW.user_id,'focus_master');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_on_task_done ON public.session_tasks;
CREATE TRIGGER trg_on_task_done
BEFORE UPDATE ON public.session_tasks
FOR EACH ROW EXECUTE FUNCTION public.on_task_done();

-- ---------- 11.1 Friends --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL DEFAULT auth.uid(),
  to_user uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (from_user <> to_user)
);
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_pending_uniq
  ON public.friend_requests(LEAST(from_user,to_user), GREATEST(from_user,to_user))
  WHERE status = 'pending';
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own requests" ON public.friend_requests FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "Send requests" ON public.friend_requests FOR INSERT TO authenticated
  WITH CHECK (from_user = auth.uid());
CREATE POLICY "Respond to own requests" ON public.friend_requests FOR UPDATE TO authenticated
  USING (to_user = auth.uid() OR from_user = auth.uid())
  WITH CHECK (to_user = auth.uid() OR from_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.friends (
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own friendships" ON public.friends FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friends
    WHERE (user_a = LEAST(_a,_b) AND user_b = GREATEST(_a,_b))
  );
$$;

CREATE OR REPLACE FUNCTION public.on_friend_request_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friends(user_a, user_b)
      VALUES (LEAST(NEW.from_user, NEW.to_user), GREATEST(NEW.from_user, NEW.to_user))
      ON CONFLICT DO NOTHING;
    NEW.responded_at := now();
    -- Social butterfly badge
    IF (SELECT count(*) FROM public.friends WHERE user_a = NEW.from_user OR user_b = NEW.from_user) >= 5 THEN
      PERFORM public.award_badge(NEW.from_user,'social_butterfly');
    END IF;
    IF (SELECT count(*) FROM public.friends WHERE user_a = NEW.to_user OR user_b = NEW.to_user) >= 5 THEN
      PERFORM public.award_badge(NEW.to_user,'social_butterfly');
    END IF;
  ELSIF NEW.status IN ('rejected','cancelled') AND OLD.status = 'pending' THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_friend_request_response ON public.friend_requests;
CREATE TRIGGER trg_on_friend_request_response
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.on_friend_request_response();

CREATE OR REPLACE FUNCTION public.search_users(_q text)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM public.profiles p
  WHERE (p.name ILIKE _q || '%' OR p.email ILIKE _q || '%')
    AND p.id <> auth.uid()
    AND p.status = 'active'
  LIMIT 20;
$$;

-- ---------- 11.3 Leaderboard views & opt-in -------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT true;

CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT s.user_id, sum(s.duration)::bigint AS minutes_total_seconds, count(*)::int AS sessions
FROM public.study_sessions s
WHERE s.duration > 0 AND s.start_time >= now() - interval '7 days'
GROUP BY s.user_id;

CREATE OR REPLACE VIEW public.leaderboard_alltime AS
SELECT s.user_id, sum(s.duration)::bigint AS minutes_total_seconds, count(*)::int AS sessions
FROM public.study_sessions s
WHERE s.duration > 0
GROUP BY s.user_id;

CREATE OR REPLACE VIEW public.leaderboard_xp_alltime AS
SELECT user_id, xp, level FROM public.user_xp;

CREATE OR REPLACE VIEW public.leaderboard_xp_weekly AS
SELECT user_id, sum(amount)::bigint AS xp
FROM public.xp_events
WHERE created_at >= now() - interval '7 days'
GROUP BY user_id;

-- ---------- 12.1 Chat upgrades --------------------------------------------
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS reply_to uuid;
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS pinned_message_id uuid;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS slow_mode_seconds int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read reactions" ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.room_messages m WHERE m.id = message_id AND public.is_room_member(auth.uid(), m.room_id)));
CREATE POLICY "Self react" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.room_messages m WHERE m.id = message_id AND public.is_room_member(auth.uid(), m.room_id)));
CREATE POLICY "Self un-react" ON public.message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- 12.2 Direct messages (friends only) ---------------------------
CREATE TABLE IF NOT EXISTS public.dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
ALTER TABLE public.dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read thread" ON public.dm_threads FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());
CREATE POLICY "Friends create thread" ON public.dm_threads FOR INSERT TO authenticated
  WITH CHECK ((user_a = auth.uid() OR user_b = auth.uid()) AND public.are_friends(user_a, user_b));

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.dm_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dm_threads t WHERE t.id = thread_id AND (t.user_a = auth.uid() OR t.user_b = auth.uid())));
CREATE POLICY "Participants send messages" ON public.dm_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.dm_threads t WHERE t.id = thread_id AND (t.user_a = auth.uid() OR t.user_b = auth.uid())));
CREATE POLICY "Participants mark read" ON public.dm_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dm_threads t WHERE t.id = thread_id AND (t.user_a = auth.uid() OR t.user_b = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dm_threads t WHERE t.id = thread_id AND (t.user_a = auth.uid() OR t.user_b = auth.uid())));

-- ---------- 12.3 Subjects -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.subjects (slug, name, icon) VALUES
  ('math','Mathematics','sigma'),
  ('cs','Computer Science','code'),
  ('bio','Biology','dna'),
  ('chem','Chemistry','flask'),
  ('physics','Physics','atom'),
  ('history','History','scroll'),
  ('languages','Languages','languages'),
  ('mba','Business / MBA','briefcase'),
  ('mcat','MCAT','stethoscope'),
  ('usmle','USMLE','heart-pulse'),
  ('lsat','LSAT','scale'),
  ('design','Design','palette'),
  ('engineering','Engineering','wrench'),
  ('econ','Economics','trending-up')
ON CONFLICT (slug) DO NOTHING;

-- ---------- Feature flags -------------------------------------------------
INSERT INTO public.system_settings (key, value, description) VALUES
  ('feature_video','false','Enable LiveKit video/audio in rooms'),
  ('feature_ai_music','false','Enable ElevenLabs focus music generation'),
  ('feature_dm','true','Enable direct messages between friends'),
  ('feature_friends','true','Enable friend graph'),
  ('feature_leaderboards','true','Enable leaderboards'),
  ('feature_pomodoro_program','true','Enable shared pomodoro programs'),
  ('feature_chat_reactions','true','Enable message reactions'),
  ('feature_subjects','true','Enable subject hubs')
ON CONFLICT (key) DO NOTHING;

-- ---------- Realtime publication ------------------------------------------
DO $$ BEGIN
  PERFORM 1;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.session_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.room_timer_program; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_xp; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.session_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.room_timer_program REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.dm_messages REPLICA IDENTITY FULL;
ALTER TABLE public.friend_requests REPLICA IDENTITY FULL;