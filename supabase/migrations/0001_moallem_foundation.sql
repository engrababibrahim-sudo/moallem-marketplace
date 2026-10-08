create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.app_role as enum ('student','parent','teacher','admin','super_admin','support');
create type public.account_status as enum ('active','suspended','deactivated');
create type public.teacher_verification_status as enum ('pending','approved','rejected','suspended');
create type public.booking_status as enum ('pending','confirmed','cancelled','completed','rejected');
create type public.payment_status as enum ('unpaid','pending','paid','failed','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.app_role not null default 'student',
  account_status public.account_status not null default 'active',
  avatar_url text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  education_stage text,
  grade text,
  learning_level text,
  goals text,
  preferred_subjects text[] not null default '{}',
  preferred_format text,
  preferred_availability text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_student_relationships (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null default 'parent',
  status text not null default 'active' check (status in ('pending','active','revoked')),
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id),
  check (parent_id <> student_id)
);

create table public.teacher_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  qualification text,
  specialization text,
  years_experience integer not null default 0 check (years_experience between 0 and 80),
  subjects text[] not null default '{}',
  education_stages text[] not null default '{}',
  grades text[] not null default '{}',
  teaching_format text,
  hourly_rate numeric(10,2) check (hourly_rate is null or hourly_rate >= 0),
  verification_status public.teacher_verification_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  day_of_week smallint check (day_of_week between 0 and 6),
  specific_date date,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Africa/Cairo',
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (day_of_week is not null or specific_date is not null)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  teacher_id uuid not null references public.teacher_profiles(id),
  subject text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Africa/Cairo',
  hourly_rate_snapshot numeric(10,2),
  total_price numeric(10,2),
  currency text not null default 'EGP',
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (student_id <> teacher_id)
);

alter table public.bookings add constraint bookings_teacher_no_overlap
  exclude using gist (teacher_id with =, tstzrange(start_at,end_at,'[)') with &&)
  where (status in ('pending','confirmed'));

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index teacher_profiles_verification_idx on public.teacher_profiles(verification_status);
create index teacher_profiles_subjects_idx on public.teacher_profiles using gin(subjects);
create index bookings_student_idx on public.bookings(student_id,start_at);
create index bookings_teacher_idx on public.bookings(teacher_id,start_at);
create index audit_logs_actor_idx on public.audit_logs(actor_id,created_at desc);
