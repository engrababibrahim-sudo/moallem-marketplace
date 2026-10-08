alter table public.teacher_profiles add column if not exists display_name text;

create or replace function public.sync_teacher_display_name()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  update public.teacher_profiles
  set display_name=new.full_name
  where id=new.id;
  return new;
end;
$$;

create trigger profile_teacher_name_sync
after update of full_name on public.profiles
for each row
when (new.role='teacher')
execute function public.sync_teacher_display_name();

update public.teacher_profiles t
set display_name=p.full_name
from public.profiles p
where p.id=t.id;

create index if not exists teacher_display_name_idx on public.teacher_profiles(display_name);
