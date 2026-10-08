-- Expose only safe teacher fields to anonymous visitors.
-- The base teacher_profiles table remains available to authenticated users
-- according to its existing RLS policies.
create or replace view public.public_teacher_directory
as
select
  id,
  display_name,
  bio,
  specialization,
  years_experience,
  subjects,
  education_stages,
  grades,
  teaching_format,
  hourly_rate,
  created_at
from public.teacher_profiles
where verification_status = 'approved';

revoke all on public.teacher_profiles from anon;
grant select on public.public_teacher_directory to anon, authenticated;
