create table if not exists public.zoom_attendance_events (
  id bigserial primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider_meeting_id text not null,
  event_type text not null check (event_type in ('meeting.participant_joined','meeting.participant_left')),
  participant_name text,
  participant_email text,
  participant_user_id text,
  event_time timestamptz not null,
  received_at timestamptz not null default now(),
  raw_event jsonb not null default '{}'::jsonb
);
create index if not exists zoom_attendance_events_booking_time_idx
  on public.zoom_attendance_events (booking_id, event_time);
create index if not exists zoom_attendance_events_meeting_idx
  on public.zoom_attendance_events (provider_meeting_id);
alter table public.zoom_attendance_events enable row level security;
revoke all on public.zoom_attendance_events from anon, authenticated;
grant select, insert, update, delete on public.zoom_attendance_events to service_role;
grant usage, select on sequence public.zoom_attendance_events_id_seq to service_role;
