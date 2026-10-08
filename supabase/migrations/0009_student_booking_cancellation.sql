-- 0009_student_booking_cancellation.sql
-- Secure student-side cancellation without exposing broader booking updates.

create or replace function public.cancel_student_booking(
  p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancellation_reason = 'إلغاء بواسطة الطالب',
    cancelled_at = now(),
    updated_at = now()
  where id = p_booking_id
    and student_id = auth.uid()
    and status in ('pending','confirmed')
  returning * into v_booking;

  if not found then
    raise exception 'booking cannot be cancelled';
  end if;

  return v_booking;
end;
$$;

revoke all on function public.cancel_student_booking(uuid) from public;
grant execute on function public.cancel_student_booking(uuid) to authenticated;
