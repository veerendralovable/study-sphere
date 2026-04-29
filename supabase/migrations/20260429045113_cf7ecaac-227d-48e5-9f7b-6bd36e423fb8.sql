
CREATE OR REPLACE FUNCTION public.join_room_by_code(_code text)
RETURNS public.room_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_member public.room_members%ROWTYPE;
  v_uid uuid := auth.uid();
  v_code text := upper(trim(coalesce(_code, '')));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF length(v_code) = 0 THEN
    RAISE EXCEPTION 'Room code required';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE upper(room_code) = v_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT * INTO v_member
  FROM public.room_members
  WHERE user_id = v_uid AND room_id = v_room.id;

  IF FOUND AND v_member.status = 'removed' THEN
    RAISE EXCEPTION 'You have been removed from this room';
  END IF;

  INSERT INTO public.room_members (user_id, room_id, role, status)
  VALUES (v_uid, v_room.id, 'member', 'active')
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET status = 'active'
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_room_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(text) TO authenticated;
