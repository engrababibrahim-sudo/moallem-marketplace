-- 0016_learning_platform_foundation.sql
-- Learning platform foundation: live sessions, educational content,
-- internal messaging and privacy-oriented contact protection.

create type public.meeting_provider as enum ('zoom','google_meet');

create type public.live_session_status as enum (
  'scheduled',
  'live',
  'completed',
  'cancelled'
);

create type public.material_type as enum (
  'text',
  'pdf',
  'image',
  'video',
  'audio',
  'link',
  'file'
);

create type public.message_status as enum (
  'sent',
  'read',
  'flagged'
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  provider public.meeting_provider not null,
  provider_meeting_id text,
  join_url text,
  host_url text,
  status public.live_session_status not null default 'scheduled',
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_sessions_time_valid check (scheduled_end_at > scheduled_start_at)
);

create index live_sessions_booking_idx on public.live_sessions(booking_id);
create index live_sessions_provider_idx on public.live_sessions(provider, status);

create table public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  live_session_id uuid references public.live_sessions(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete restrict,
  title text not null,
  description text,
  material_type public.material_type not null,
  storage_path text,
  external_url text,
  content_text text,
  is_visible_to_student boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_materials_source_check check (
    storage_path is not null
    or external_url is not null
    or content_text is not null
  )
);

create index lesson_materials_booking_idx on public.lesson_materials(booking_id, created_at desc);
create index lesson_materials_session_idx on public.lesson_materials(live_session_id, created_at desc);
create index lesson_materials_teacher_idx on public.lesson_materials(teacher_id, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete restrict,
  teacher_id uuid not null references public.teacher_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_participants_different check (student_id <> teacher_id)
);

create unique index conversations_booking_unique
  on public.conversations(booking_id)
  where booking_id is not null;

create index conversations_student_idx on public.conversations(student_id, updated_at desc);
create index conversations_teacher_idx on public.conversations(teacher_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  status public.message_status not null default 'sent',
  flagged_reason text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_body_not_empty check (length(trim(body)) > 0),
  constraint messages_body_limit check (length(body) <= 5000)
);

create index messages_conversation_idx on public.messages(conversation_id, created_at asc);
create index messages_sender_idx on public.messages(sender_id, created_at desc);
create index messages_status_idx on public.messages(status, created_at desc);

alter table public.live_sessions enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy live_sessions_participant_read
on public.live_sessions
for select to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.id = live_sessions.booking_id
      and (b.student_id = auth.uid() or b.teacher_id = auth.uid())
  )
  or public.is_staff()
);

create policy live_sessions_staff_all
on public.live_sessions
for all to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy lesson_materials_participant_read
on public.lesson_materials
for select to authenticated
using (
  teacher_id = auth.uid()
  or (
    is_visible_to_student
    and exists (
      select 1 from public.bookings b
      where b.id = lesson_materials.booking_id
        and b.student_id = auth.uid()
    )
  )
  or public.is_staff()
);

create policy lesson_materials_teacher_insert
on public.lesson_materials
for insert to authenticated
with check (
  teacher_id = auth.uid()
  and public.is_active_user()
);

create policy lesson_materials_teacher_update
on public.lesson_materials
for update to authenticated
using (teacher_id = auth.uid() or public.is_staff())
with check (teacher_id = auth.uid() or public.is_staff());

create policy lesson_materials_teacher_delete
on public.lesson_materials
for delete to authenticated
using (teacher_id = auth.uid() or public.is_staff());

create policy conversations_participant_read
on public.conversations
for select to authenticated
using (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or public.is_staff()
);

create policy conversations_participant_insert
on public.conversations
for insert to authenticated
with check (
  (student_id = auth.uid() or teacher_id = auth.uid())
  and public.is_active_user()
  and exists (
    select 1 from public.bookings b
    where b.id = conversations.booking_id
      and b.student_id = conversations.student_id
      and b.teacher_id = conversations.teacher_id
  )
);

create policy conversations_participant_update
on public.conversations
for update to authenticated
using (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or public.is_staff()
)
with check (
  student_id = auth.uid()
  or teacher_id = auth.uid()
  or public.is_staff()
);

create policy messages_participant_read
on public.messages
for select to authenticated
using (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid() or c.teacher_id = auth.uid())
  )
  or public.is_staff()
);

create policy messages_participant_insert
on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.is_active_user()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid() or c.teacher_id = auth.uid())
  )
);

create policy messages_participant_update
on public.messages
for update to authenticated
using (
  sender_id = auth.uid()
  or exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid() or c.teacher_id = auth.uid())
  )
  or public.is_staff()
)
with check (
  sender_id = auth.uid()
  or public.is_staff()
);

-- Do not expose phone/email/contact fields through this messaging foundation.
-- Contact filtering will be enforced at the application/service layer before
-- messages are inserted, while audit/moderation records remain available to staff.
