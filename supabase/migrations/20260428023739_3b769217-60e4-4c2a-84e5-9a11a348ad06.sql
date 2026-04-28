
-- =========================================
-- PROFILES
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- =========================================
-- ROOMS
-- =========================================
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  is_private boolean not null default false,
  room_code text unique,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Rooms viewable by authenticated"
  on public.rooms for select
  to authenticated using (true);

create policy "Users can create rooms"
  on public.rooms for insert
  to authenticated with check (auth.uid() = created_by);

create policy "Creator can update their room"
  on public.rooms for update
  to authenticated using (auth.uid() = created_by);

create policy "Creator can delete their room"
  on public.rooms for delete
  to authenticated using (auth.uid() = created_by);

-- =========================================
-- ROOM MEMBERS
-- =========================================
create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique (user_id, room_id)
);

create index room_members_room_id_idx on public.room_members(room_id);
create index room_members_user_id_idx on public.room_members(user_id);

alter table public.room_members enable row level security;

-- Security definer helper to check if a user owns a room (avoids recursion)
create or replace function public.is_room_creator(_user_id uuid, _room_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.rooms where id = _room_id and created_by = _user_id)
$$;

create policy "Members viewable by authenticated"
  on public.room_members for select
  to authenticated using (true);

create policy "Users can insert own membership"
  on public.room_members for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users update own membership or creator updates any"
  on public.room_members for update
  to authenticated
  using (auth.uid() = user_id or public.is_room_creator(auth.uid(), room_id));

-- =========================================
-- TIMERS
-- =========================================
create table public.timers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_time timestamptz,
  duration integer,
  is_active boolean not null default false
);

create unique index timers_room_id_unique on public.timers(room_id);

alter table public.timers enable row level security;

create policy "Timers viewable by authenticated"
  on public.timers for select
  to authenticated using (true);

create policy "Authenticated can insert timers"
  on public.timers for insert
  to authenticated with check (true);

create policy "Authenticated can update timers"
  on public.timers for update
  to authenticated using (true);

-- =========================================
-- STUDY SESSIONS
-- =========================================
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration integer,
  created_at timestamptz not null default now()
);

create index study_sessions_user_id_idx on public.study_sessions(user_id);
create index study_sessions_start_idx on public.study_sessions(start_time);

alter table public.study_sessions enable row level security;

create policy "Users view own sessions"
  on public.study_sessions for select
  to authenticated using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.study_sessions for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.study_sessions for update
  to authenticated using (auth.uid() = user_id);

-- =========================================
-- AUTH TRIGGER: auto-create profile on signup
-- =========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================
-- AUTO-GENERATE room_code on insert
-- =========================================
create or replace function public.generate_room_code()
returns trigger language plpgsql as $$
declare
  new_code text;
  attempts int := 0;
begin
  if new.room_code is null then
    loop
      new_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (select 1 from public.rooms where room_code = new_code);
      attempts := attempts + 1;
      if attempts > 10 then exit; end if;
    end loop;
    new.room_code := new_code;
  end if;
  return new;
end;
$$;

create trigger rooms_set_room_code
  before insert on public.rooms
  for each row execute function public.generate_room_code();

-- =========================================
-- REALTIME
-- =========================================
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.timers;
alter table public.room_members replica identity full;
alter table public.timers replica identity full;
