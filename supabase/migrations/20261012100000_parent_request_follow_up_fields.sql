-- Add persistent staff follow-up fields to parent requests.
alter table public.parent_requests
  add column if not exists assigned_teacher text,
  add column if not exists follow_up_notes text;

comment on column public.parent_requests.assigned_teacher is 'Teacher suggested by staff for this parent request';
comment on column public.parent_requests.follow_up_notes is 'Internal staff follow-up notes for this request';
