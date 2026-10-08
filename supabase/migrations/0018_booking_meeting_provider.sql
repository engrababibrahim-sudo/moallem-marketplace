-- 0018_booking_meeting_provider.sql
-- Make the live-class provider a first-class booking property.
-- This avoids rebuilding bookings later when Zoom / Google Meet are enabled.

alter table public.bookings
  add column if not exists meeting_provider public.meeting_provider;

create index if not exists bookings_meeting_provider_idx
  on public.bookings(meeting_provider, status, created_at desc);

-- Existing confirmed bookings remain nullable until the teacher/platform
-- selects a provider. New bookings may select either supported provider.
