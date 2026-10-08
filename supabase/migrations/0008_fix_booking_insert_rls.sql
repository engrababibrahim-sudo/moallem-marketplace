-- 0008_fix_booking_insert_rls.sql
-- Allow active students to create bookings for approved, active teachers.
-- The booking INSERT policy previously joined profiles, whose RLS can hide the
-- teacher profile from a student and incorrectly reject an otherwise valid booking.

create or replace function public.is_bookable_teacher(p_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_profiles t
    join public.profiles p on p.id = t.id
    where t.id = p_teacher_id
      and t.verification_status = 'approved'
      and p.account_status = 'active'
  );
$$;

revoke all on function public.is_bookable_teacher(uuid) from public;
grant execute on function public.is_bookable_teacher(uuid) to authenticated;

drop policy if exists bookings_student_insert on public.bookings;

create policy bookings_student_insert
on public.bookings
for insert
to authenticated
with check (
  student_id = auth.uid()
  and public.is_active_user()
  and public.is_bookable_teacher(teacher_id)
);
