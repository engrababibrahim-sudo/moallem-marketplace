-- 0010_finance_and_commissions.sql
-- Financial ledger foundation for multi-currency bookings and platform commissions.

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  teacher_id uuid not null references public.teacher_profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null,
  platform_commission_rate numeric(5,2) not null default 10.00 check (platform_commission_rate between 0 and 100),
  platform_commission_amount numeric(12,2) not null default 0 check (platform_commission_amount >= 0),
  teacher_net_amount numeric(12,2) not null default 0 check (teacher_net_amount >= 0),
  status public.payment_status not null default 'unpaid',
  provider text,
  provider_transaction_id text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (platform_commission_amount + teacher_net_amount = amount)
);

create unique index payment_transactions_booking_unique
on public.payment_transactions(booking_id);

create index payment_transactions_student_idx
on public.payment_transactions(student_id, created_at desc);

create index payment_transactions_teacher_idx
on public.payment_transactions(teacher_id, created_at desc);

create index payment_transactions_status_idx
on public.payment_transactions(status, created_at desc);

create or replace function public.calculate_payment_split(
  p_amount numeric,
  p_commission_rate numeric default 10.00
)
returns table (
  commission_amount numeric,
  teacher_net_amount numeric
)
language sql
immutable
as $$
  select
    round(greatest(p_amount,0) * greatest(least(p_commission_rate,100),0) / 100, 2),
    round(greatest(p_amount,0) - (greatest(p_amount,0) * greatest(least(p_commission_rate,100),0) / 100), 2);
$$;

alter table public.payment_transactions enable row level security;

create policy payment_transactions_student_read
on public.payment_transactions
for select to authenticated
using (student_id = auth.uid() or public.is_staff());

create policy payment_transactions_teacher_read
on public.payment_transactions
for select to authenticated
using (teacher_id = auth.uid() or public.is_staff());

create policy payment_transactions_staff_all
on public.payment_transactions
for all to authenticated
using (public.is_staff())
with check (public.is_staff());

revoke all on function public.calculate_payment_split(numeric,numeric) from public;
grant execute on function public.calculate_payment_split(numeric,numeric) to authenticated;
