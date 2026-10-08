create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger student_profiles_updated_at before update on public.student_profiles for each row execute function public.set_updated_at();
create trigger teacher_profiles_updated_at before update on public.teacher_profiles for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare requested text;
begin
  requested := lower(coalesce(new.raw_user_meta_data->>'requested_role','student'));
  if requested not in ('student','parent','teacher') then requested := 'student'; end if;
  insert into public.profiles(id,full_name,email,role)
  values(new.id,nullif(trim(new.raw_user_meta_data->>'full_name'),''),new.email,requested::public.app_role);
  if requested = 'student' then insert into public.student_profiles(id) values(new.id);
  elsif requested = 'teacher' then insert into public.teacher_profiles(id) values(new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin','support') and account_status='active'); $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin') and account_status='active'); $$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and account_status='active'); $$;

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.parent_student_relationships enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.teacher_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles,public.student_profiles,public.parent_student_relationships,public.teacher_profiles,public.teacher_availability,public.bookings,public.audit_logs from anon;
grant select,insert,update on public.profiles,public.student_profiles,public.parent_student_relationships,public.teacher_profiles,public.teacher_availability,public.bookings to authenticated;
grant select,insert on public.audit_logs to authenticated;

create policy profiles_select on public.profiles for select to authenticated
using(id=auth.uid() or public.is_staff());

create policy profiles_update_self on public.profiles for update to authenticated
using(id=auth.uid() and public.is_active_user())
with check(id=auth.uid());

create policy profiles_update_staff on public.profiles for update to authenticated
using(public.is_admin()) with check(public.is_admin());

create policy student_profile_access on public.student_profiles for select to authenticated
using(id=auth.uid() or exists(select 1 from public.parent_student_relationships r where r.student_id=id and r.parent_id=auth.uid() and r.status='active') or public.is_staff());

create policy student_profile_update on public.student_profiles for update to authenticated
using(id=auth.uid() and public.is_active_user()) with check(id=auth.uid());

create policy teacher_public_read on public.teacher_profiles for select to anon,authenticated
using(verification_status='approved' or id=auth.uid() or public.is_staff());

create policy teacher_self_insert on public.teacher_profiles for insert to authenticated
with check(id=auth.uid());

create policy teacher_self_update on public.teacher_profiles for update to authenticated
using(id=auth.uid() and public.is_active_user() and verification_status <> 'suspended')
with check(id=auth.uid());

create policy teacher_admin_review on public.teacher_profiles for update to authenticated
using(public.is_admin()) with check(public.is_admin());

create policy availability_read on public.teacher_availability for select to anon,authenticated
using(exists(select 1 from public.teacher_profiles t where t.id=teacher_id and t.verification_status='approved') or teacher_id=auth.uid() or public.is_staff());

create policy availability_teacher on public.teacher_availability for all to authenticated
using(teacher_id=auth.uid() and public.is_active_user())
with check(teacher_id=auth.uid() and public.is_active_user() and exists(select 1 from public.teacher_profiles t where t.id=auth.uid() and t.verification_status='approved'));

create policy parent_relationship_read on public.parent_student_relationships for select to authenticated
using(parent_id=auth.uid() or student_id=auth.uid() or public.is_staff());

create policy parent_relationship_insert on public.parent_student_relationships for insert to authenticated
with check(parent_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='parent' and p.account_status='active'));

create policy bookings_read on public.bookings for select to authenticated
using(student_id=auth.uid() or teacher_id=auth.uid() or public.is_staff());

create policy bookings_student_insert on public.bookings for insert to authenticated
with check(student_id=auth.uid() and public.is_active_user() and exists(
  select 1 from public.teacher_profiles t join public.profiles p on p.id=t.id
  where t.id=teacher_id and t.verification_status='approved' and p.account_status='active'
));

create policy bookings_participant_update on public.bookings for update to authenticated
using((student_id=auth.uid() or teacher_id=auth.uid()) and public.is_active_user())
with check((student_id=auth.uid() or teacher_id=auth.uid()) and public.is_active_user());

create policy bookings_staff_update on public.bookings for update to authenticated
using(public.is_staff()) with check(public.is_staff());

create policy audit_staff_read on public.audit_logs for select to authenticated using(public.is_staff());
create policy audit_insert_self on public.audit_logs for insert to authenticated with check(actor_id=auth.uid());

grant execute on function public.is_staff(),public.is_admin(),public.is_active_user() to authenticated;
