create table if not exists public.teacher_zoom_connections (teacher_id uuid primary key references public.profiles(id) on delete cascade, zoom_user_id text not null, zoom_email text not null, access_token_encrypted text not null, refresh_token_encrypted text not null, expires_at timestamptz not null, scopes text, connected_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.teacher_zoom_connections enable row level security;
revoke all on public.teacher_zoom_connections from anon, authenticated;
