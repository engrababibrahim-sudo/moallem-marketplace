-- International marketplace: teacher country and pricing currency.
alter table public.profiles
  add column if not exists country text;

alter table public.teacher_profiles
  add column if not exists currency text not null default 'EGP';

alter table public.teacher_profiles
  add constraint teacher_profiles_currency_check
  check (currency in ('EGP','SAR','AED','KWD','QAR','BHD','OMR','USD','EUR','GBP','CAD','AUD','TRY','JOD','MAD','DZD','TND'));

create or replace view public.public_teacher_directory
as
select
  tp.id,
  tp.display_name,
  p.country,
  tp.bio,
  tp.specialization,
  tp.years_experience,
  tp.subjects,
  tp.education_stages,
  tp.grades,
  tp.teaching_format,
  tp.hourly_rate,
  tp.currency,
  tp.created_at
from public.teacher_profiles tp
join public.profiles p on p.id = tp.id
where tp.verification_status = 'approved';

grant select on public.public_teacher_directory to anon, authenticated;
