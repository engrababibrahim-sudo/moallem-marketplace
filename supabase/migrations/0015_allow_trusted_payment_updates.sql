-- 0015_allow_trusted_payment_updates.sql
-- Allow trusted payment RPCs to update payment_status without exposing
-- direct payment-status updates to students.

create or replace function public.protect_booking_fields()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if coalesce(current_setting('app.internal_payment_update', true), 'off') = 'on' then
    return new;
  end if;

  if not public.is_staff() and auth.uid() = old.student_id then
    if new.student_id <> old.student_id or new.teacher_id <> old.teacher_id
       or new.start_at <> old.start_at or new.end_at <> old.end_at
       or new.hourly_rate_snapshot is distinct from old.hourly_rate_snapshot
       or new.total_price is distinct from old.total_price
       or new.payment_status <> old.payment_status then
      raise exception 'booking ownership, schedule and payment fields are protected';
    end if;
  elsif not public.is_staff() and auth.uid() = old.teacher_id then
    if new.student_id <> old.student_id or new.teacher_id <> old.teacher_id
       or new.start_at <> old.start_at or new.end_at <> old.end_at
       or new.hourly_rate_snapshot is distinct from old.hourly_rate_snapshot
       or new.total_price is distinct from old.total_price
       or new.payment_status <> old.payment_status then
      raise exception 'booking ownership, schedule and payment fields are protected';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.simulate_student_payment(
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

  perform set_config('app.internal_payment_update', 'on', true);

  update public.bookings
  set
    payment_status = 'paid',
    updated_at = now()
  where id = p_booking_id
    and student_id = auth.uid()
    and status = 'confirmed'
    and payment_status in ('unpaid','failed')
  returning * into v_booking;

  if not found then
    raise exception 'booking is not eligible for test payment';
  end if;

  update public.payment_transactions
  set
    status = 'paid',
    paid_at = now(),
    updated_at = now()
  where booking_id = p_booking_id
    and student_id = auth.uid();

  return v_booking;
end;
$$;

revoke all on function public.simulate_student_payment(uuid) from public;
grant execute on function public.simulate_student_payment(uuid) to authenticated;
