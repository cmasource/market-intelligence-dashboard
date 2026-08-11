create table if not exists public.arbitrage_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_provider_id text not null,
  destination_provider_id text not null,
  transfer_asset text not null check (transfer_asset in ('USD_BANK', 'USDT', 'USDC')),
  amount_usd numeric not null check (amount_usd between 1 and 1000000),
  minimum_gross_spread_ars numeric not null check (minimum_gross_spread_ars between 0.01 and 1000000),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_provider_id <> destination_provider_id),
  unique (user_id, source_provider_id, destination_provider_id, transfer_asset)
);

create index if not exists arbitrage_alert_subscriptions_user_enabled_idx
  on public.arbitrage_alert_subscriptions (user_id, enabled, updated_at desc);

alter table public.arbitrage_alert_subscriptions enable row level security;

create policy "Users can select own arbitrage alert subscriptions"
  on public.arbitrage_alert_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own arbitrage alert subscriptions"
  on public.arbitrage_alert_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own arbitrage alert subscriptions"
  on public.arbitrage_alert_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own arbitrage alert subscriptions"
  on public.arbitrage_alert_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.arbitrage_alert_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.arbitrage_alert_subscriptions to authenticated;
grant select, insert, update, delete on public.arbitrage_alert_subscriptions to service_role;
