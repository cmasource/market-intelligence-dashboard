create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  watchlist_item_id uuid not null references public.watchlist_items(id) on delete cascade,
  instrument_id text not null,
  instrument_symbol text not null,
  instrument_name text not null,
  market text not null,
  exchange text,
  currency text not null,
  asset_type text not null,
  condition text not null check (condition in (
    'price_above',
    'price_below',
    'rapid_rise',
    'rapid_fall',
    'near_ema200',
    'near_period_low',
    'near_period_high'
  )),
  target_value numeric,
  threshold_percent numeric,
  lookback_bars integer,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_value is null or target_value > 0),
  check (threshold_percent is null or threshold_percent between 0.1 and 50),
  check (lookback_bars is null or lookback_bars between 20 and 250),
  check (
    (condition in ('price_above', 'price_below') and target_value is not null and threshold_percent is null and lookback_bars is null)
    or
    (condition in ('rapid_rise', 'rapid_fall', 'near_ema200') and target_value is null and threshold_percent is not null and lookback_bars is null)
    or
    (condition in ('near_period_low', 'near_period_high') and target_value is null and threshold_percent is not null and lookback_bars is not null)
  ),
  unique (user_id, instrument_id, condition)
);

create index if not exists alert_subscriptions_user_enabled_idx
  on public.alert_subscriptions (user_id, enabled, updated_at desc);
create index if not exists alert_subscriptions_instrument_idx
  on public.alert_subscriptions (instrument_id, enabled);
create index if not exists alert_subscriptions_watchlist_id_idx
  on public.alert_subscriptions (watchlist_id);
create index if not exists alert_subscriptions_watchlist_item_id_idx
  on public.alert_subscriptions (watchlist_item_id);

alter table public.alert_subscriptions enable row level security;

create policy "Users can select own alert subscriptions"
  on public.alert_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own alert subscriptions"
  on public.alert_subscriptions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.watchlist_items item
      where item.id = alert_subscriptions.watchlist_item_id
        and item.watchlist_id = alert_subscriptions.watchlist_id
        and item.user_id = (select auth.uid())
        and coalesce(item.instrument_id, item.item ->> 'instrumentId', item.asset_key) = alert_subscriptions.instrument_id
    )
  );

create policy "Users can update own alert subscriptions"
  on public.alert_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.watchlist_items item
      where item.id = alert_subscriptions.watchlist_item_id
        and item.watchlist_id = alert_subscriptions.watchlist_id
        and item.user_id = (select auth.uid())
        and coalesce(item.instrument_id, item.item ->> 'instrumentId', item.asset_key) = alert_subscriptions.instrument_id
    )
  );

create policy "Users can delete own alert subscriptions"
  on public.alert_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.alert_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.alert_subscriptions to authenticated;
grant select, insert, update, delete on public.alert_subscriptions to service_role;
