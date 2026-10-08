-- 0014_test_payment_flow.sql
-- Test-only payment flow. No real money is moved.
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
