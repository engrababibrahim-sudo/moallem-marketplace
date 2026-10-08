-- 0013_paymob_payment_gateway.sql
-- Payment gateway metadata for Paymob and the SELECT grant required by the admin finance UI.

grant select on public.payment_transactions to authenticated;

create index if not exists payment_transactions_provider_tx_idx
  on public.payment_transactions(provider, provider_transaction_id)
  where provider is not null and provider_transaction_id is not null;
