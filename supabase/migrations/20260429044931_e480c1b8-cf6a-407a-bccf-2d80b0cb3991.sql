
-- =========================================================
-- 1. ROOMS: restrict SELECT so private rooms only visible to members/creator
-- =========================================================
DROP POLICY IF EXISTS "Rooms viewable by authenticated" ON public.rooms;

CREATE POLICY "Public rooms or own/member rooms viewable"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private
    OR auth.uid() = created_by
    OR public.is_room_member(auth.uid(), id)
  );

-- =========================================================
-- 2. ROOM_MEMBERS: restrict SELECT to room members and own rows
-- =========================================================
DROP POLICY IF EXISTS "Members viewable by authenticated" ON public.room_members;

CREATE POLICY "Members viewable by room members"
  ON public.room_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_room_member(auth.uid(), room_id)
  );

-- =========================================================
-- 3. ROOM_MEMBERS: block direct INSERT into private rooms
-- (force private joins through join_private_room RPC)
-- =========================================================
DROP POLICY IF EXISTS "Users can insert own membership" ON public.room_members;

CREATE POLICY "Users can insert own membership for public rooms"
  ON public.room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- creator can always insert their own membership row
      EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.created_by = auth.uid())
      OR
      -- anyone can join public rooms directly
      EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.is_private = false)
    )
  );

-- =========================================================
-- 4. PROFILES: restrict SELECT to self + co-members in active rooms
-- =========================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE OR REPLACE FUNCTION public.shares_active_room(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members vm
    JOIN public.room_members tm ON tm.room_id = vm.room_id
    WHERE vm.user_id = _viewer AND vm.status = 'active'
      AND tm.user_id = _target AND tm.status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.shares_active_room(uuid, uuid) FROM anon, authenticated, public;

CREATE POLICY "Profiles viewable by self or co-members"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.shares_active_room(auth.uid(), id)
  );

-- =========================================================
-- 5. RPC: join_private_room - server-side code validation
-- =========================================================
CREATE OR REPLACE FUNCTION public.join_private_room(_room_id uuid, _code text)
RETURNS public.room_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_member public.room_members%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = _room_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.is_private THEN
    IF _code IS NULL OR upper(trim(_code)) <> upper(coalesce(v_room.room_code, '')) THEN
      RAISE EXCEPTION 'Invalid room code';
    END IF;
  END IF;

  -- Check if already removed
  SELECT * INTO v_member
  FROM public.room_members
  WHERE user_id = v_uid AND room_id = _room_id;

  IF FOUND AND v_member.status = 'removed' THEN
    RAISE EXCEPTION 'You have been removed from this room';
  END IF;

  INSERT INTO public.room_members (user_id, room_id, role, status)
  VALUES (v_uid, _room_id, 'member', 'active')
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET status = 'active'
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_private_room(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_private_room(uuid, text) TO authenticated;
