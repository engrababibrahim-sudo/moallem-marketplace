-- 0017_live_session_access_security.sql
-- Never expose provider host/start URLs directly through table reads.
-- Access is returned through a security-definer RPC with role-aware fields.

revoke select on public.live_sessions from authenticated, anon;

drop policy if exists live_sessions_participant_read on public.live_sessions;

create or replace function public.get_live_session_access(
  p_session_id uuid
)
returns table (
  id uuid,
  booking_id uuid,
  provider public.meeting_provider,
  provider_meeting_id text,
  join_url text,
  host_url text,
  status public.live_session_status,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  return query
  select
    s.id,
    s.booking_id,
    s.provider,
    s.provider_meeting_id,
    s.join_url,
    case
      when b.teacher_id = auth.uid() or public.is_staff()
        then s.host_url
      else null
    end as host_url,
    s.status,
    s.scheduled_start_at,
    s.scheduled_end_at,
    s.started_at,
    s.ended_at
  from public.live_sessions s
  join public.bookings b on b.id = s.booking_id
  where s.id = p_session_id
    and (
      b.student_id = auth.uid()
      or b.teacher_id = auth.uid()
      or public.is_staff()
    );
end;
$$;

revoke all on function public.get_live_session_access(uuid) from public;
grant execute on function public.get_live_session_access(uuid) to authenticated;
