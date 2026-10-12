-- Secure read/update access for staff; public visitors can only insert new requests.
drop policy if exists "Staff can read parent requests" on public.parent_requests;
create policy "Staff can read parent requests"
  on public.parent_requests for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','super_admin','support')
      and p.account_status = 'active'
  ));

drop policy if exists "Staff can update parent requests" on public.parent_requests;
create policy "Staff can update parent requests"
  on public.parent_requests for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','super_admin','support')
      and p.account_status = 'active'
  ))
  with check (status in ('new','contacted','closed') and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','super_admin','support')
      and p.account_status = 'active'
  ));
