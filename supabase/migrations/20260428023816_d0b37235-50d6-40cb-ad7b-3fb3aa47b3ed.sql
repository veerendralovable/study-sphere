
-- Replace overly-permissive timer policies
drop policy if exists "Authenticated can insert timers" on public.timers;
drop policy if exists "Authenticated can update timers" on public.timers;

create or replace function public.is_room_member(_user_id uuid, _room_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where user_id = _user_id and room_id = _room_id and status = 'active'
  )
$$;

create policy "Active members can insert timers"
  on public.timers for insert to authenticated
  with check (public.is_room_member(auth.uid(), room_id));

create policy "Active members can update timers"
  on public.timers for update to authenticated
  using (public.is_room_member(auth.uid(), room_id));

-- Lock down SECURITY DEFINER helpers from direct API access
revoke execute on function public.is_room_creator(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.is_room_member(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.generate_room_code() from anon, authenticated, public;
