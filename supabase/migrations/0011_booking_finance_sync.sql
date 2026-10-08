-- 0011_booking_finance_sync.sql
-- Create a financial transaction automatically when a booking is confirmed.

create or replace function public.sync_booking_payment_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(5,2) := 10.00;
  v_commission numeric(12,2);
  v_teacher_net numeric(12,2);
begin
  if new.status = 'confirmed' then
    v_commission := round(greatest(coalesce(new.total_price,0),0) * v_rate / 100, 2);
    v_teacher_net := round(greatest(coalesce(new.total_price,0),0) - v_commission, 2);

    insert into public.payment_transactions (
      booking_id,
      student_id,
      teacher_id,
      amount,
      currency,
      platform_commission_rate,
      platform_commission_amount,
      teacher_net_amount,
      status
    )
    values (
      new.id,
      new.student_id,
      new.teacher_id,
      greatest(coalesce(new.total_price,0),0),
      new.currency,
      v_rate,
      v_commission,
      v_teacher_net,
      new.payment_status
    )
    on conflict (booking_id) do update
    set
      amount = excluded.amount,
      currency = excluded.currency,
      platform_commission_rate = excluded.platform_commission_rate,
      platform_commission_amount = excluded.platform_commission_amount,
      teacher_net_amount = excluded.teacher_net_amount,
      status = excluded.status,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists sync_booking_payment_transaction_trigger on public.bookings;

create trigger sync_booking_payment_transaction_trigger
after insert or update of status, total_price, currency, payment_status
on public.bookings
for each row
execute function public.sync_booking_payment_transaction();

revoke all on function public.sync_booking_payment_transaction() from public;
