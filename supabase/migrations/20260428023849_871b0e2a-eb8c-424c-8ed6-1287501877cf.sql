
create or replace function public.generate_room_code()
returns trigger language plpgsql
set search_path = public
as $$
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
