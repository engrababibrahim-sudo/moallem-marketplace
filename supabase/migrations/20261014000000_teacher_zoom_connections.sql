-- Required by the Zoom OAuth callback and live-session creation endpoints.
-- Run this migration against the Supabase project used by Production.
create table if not exists public.teacher_zoom_connections (
  teacher_id uuid primary key references auth.users(id) on delete cascade,
  zoom_user_id text not null,
  zoom_email text not null,
  connected_at timestamptz not null default now(),
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OAuth tokens must never be readable by browser clients.
alter table public.teacher_zoom_connections enable row level security;

-- API routes access this table with the server-side service role only.
-- No anon/authenticated policies are intentionally created.

-- Refresh PostgREST's schema cache so the API can see the new table.
notify pgrst, 'reload schema';
