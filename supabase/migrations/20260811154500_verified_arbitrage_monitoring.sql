alter table public.arbitrage_alert_subscriptions
  add column if not exists scope text not null default 'route';

alter table public.arbitrage_alert_subscriptions
  alter column source_provider_id drop not null,
  alter column destination_provider_id drop not null;

alter table public.arbitrage_alert_subscriptions
  drop constraint if exists arbitrage_alert_subscriptions_check;

alter table public.arbitrage_alert_subscriptions
  add constraint arbitrage_alert_subscriptions_scope_check
  check (
    (
      scope = 'route'
      and source_provider_id is not null
      and destination_provider_id is not null
      and source_provider_id <> destination_provider_id
    )
    or
    (
      scope = 'any_verified'
      and source_provider_id is null
      and destination_provider_id is null
    )
  );

create unique index if not exists arbitrage_alert_subscriptions_any_verified_unique_idx
  on public.arbitrage_alert_subscriptions (user_id, transfer_asset)
  where scope = 'any_verified';

create index if not exists arbitrage_alert_subscriptions_scope_enabled_idx
  on public.arbitrage_alert_subscriptions (scope, transfer_asset, enabled)
  where enabled = true;
