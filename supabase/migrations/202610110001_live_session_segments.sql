create table if not exists public.live_session_segments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  segment_number integer not null check (segment_number >= 2),
  provider text not null default 'zoom' check (provider = 'zoom'),
  provider_meeting_id text not null unique,
  join_url text not null,
  host_url text not null,
  status text not null default 'scheduled',
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (booking_id, segment_number)
);
create index if not exists live_session_segments_booking_idx
  on public.live_session_segments (booking_id, segment_number);
alter table public.live_session_segments enable row level security;
revoke all on public.live_session_segments from anon, authenticated;
grant select, insert, update, delete on public.live_session_segments to service_role;
