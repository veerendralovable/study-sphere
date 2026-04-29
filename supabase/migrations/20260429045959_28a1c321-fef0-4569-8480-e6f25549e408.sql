-- =========================================================
-- 1. Tighten timers SELECT policy
-- =========================================================
DROP POLICY IF EXISTS "Timers viewable by authenticated" ON public.timers;

CREATE POLICY "Timers viewable by room members"
ON public.timers
FOR SELECT
TO authenticated
USING (public.is_room_member(auth.uid(), room_id));

-- =========================================================
-- 2. Hide room_code from non-members
--    Strategy: keep base rooms table SELECT restricted to
--    creator + active members (so room_code is protected),
--    and expose a code-less view `rooms_public` for discovery.
-- =========================================================
DROP POLICY IF EXISTS "Public rooms or own/member rooms viewable" ON public.rooms;

CREATE POLICY "Rooms readable by creator or active members"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.is_room_member(auth.uid(), id)
);

-- Public-safe listing view (no room_code column)
CREATE OR REPLACE VIEW public.rooms_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  is_private,
  created_by,
  created_at
FROM public.rooms
WHERE
  is_private = false
  OR auth.uid() = created_by
  OR public.is_room_member(auth.uid(), id);

GRANT SELECT ON public.rooms_public TO authenticated;

-- =========================================================
-- 3. Lock down SECURITY DEFINER functions
--    Revoke from PUBLIC/anon, grant only what the app needs.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.join_private_room(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_room_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_active_room(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_creator(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.join_private_room(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text) TO authenticated;
-- helpers stay callable by authenticated for RLS use; PostgREST won't expose them publicly
GRANT EXECUTE ON FUNCTION public.shares_active_room(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_creator(uuid, uuid) TO authenticated;

-- =========================================================
-- 4. Exam Mode column on rooms
-- =========================================================
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS exam_mode boolean NOT NULL DEFAULT false;

-- Recreate the view to include exam_mode (visible to everyone who can see the row)
CREATE OR REPLACE VIEW public.rooms_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  is_private,
  created_by,
  created_at,
  exam_mode
FROM public.rooms
WHERE
  is_private = false
  OR auth.uid() = created_by
  OR public.is_room_member(auth.uid(), id);

GRANT SELECT ON public.rooms_public TO authenticated;