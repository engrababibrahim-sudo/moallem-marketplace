
-- Store a private lesson recording link for each booking.
alter table public.bookings
  add column if not exists recording_url text,
  add column if not exists recording_published_at timestamptz;

-- Only allow the student or teacher attached to the booking,
-- or an authorized service-role operation, to access the link.
-- Access policies for this column must be enforced through
-- the existing bookings RLS policies and a server-side API.
