-- 0012_set_platform_commission_20.sql
-- Platform commission is 20% of the booking amount.

update public.payment_transactions
set
  platform_commission_rate = 20.00,
  platform_commission_amount = round(amount * 20 / 100, 2),
  teacher_net_amount = round(amount - (amount * 20 / 100), 2),
  updated_at = now();

create or replace function public.sync_booking_payment_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(5,2) := 20.00;
  v_commission numeric(12,2);
  v_teacher_net numeric(12,2);
begin
  if new.status = 'confirmed' then
    v_commission := round(greatest(coalesce(new.total_price,0),0) * v_rate / 100, 2);
    v_teacher_net := round(greatest(coalesce(new.total_price,0),0) - v_commission, 2);

    insert into public.payment_transactions (
      booking_id, student_id, teacher_id, amount, currency,
      platform_commission_rate, platform_commission_amount,
      teacher_net_amount, status
    )
    values (
      new.id, new.student_id, new.teacher_id,
      greatest(coalesce(new.total_price,0),0), new.currency,
      v_rate, v_commission, v_teacher_net, new.payment_status
    )
    on conflict (booking_id) do update set
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
