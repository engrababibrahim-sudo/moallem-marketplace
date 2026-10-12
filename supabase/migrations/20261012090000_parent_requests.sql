-- International parent/student contact requests for Moallem.
create table if not exists public.parent_requests (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null check (char_length(parent_name) between 2 and 120),
  country text not null,
  dial_code text not null default '',
  phone text not null,
  stages text[] not null default '{}',
  subjects text[] not null default '{}',
  notes text,
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);

alter table public.parent_requests enable row level security;

-- Visitors may submit a request; public visitors cannot read or modify requests.
drop policy if exists "Anyone can submit parent requests" on public.parent_requests;
create policy "Anyone can submit parent requests"
  on public.parent_requests for insert
  to anon, authenticated
  with check (
    char_length(parent_name) between 2 and 120
    and char_length(phone) between 3 and 24
    and cardinality(stages) > 0
    and cardinality(subjects) > 0
    and status = 'new'
  );
