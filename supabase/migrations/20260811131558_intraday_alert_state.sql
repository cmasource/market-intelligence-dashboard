create table if not exists public.alert_subscription_states (
  subscription_id uuid primary key references public.alert_subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument_id text not null,
  last_price numeric,
  change_percent numeric,
  observed_at timestamptz,
  fetched_at timestamptz,
  provider text,
  data_delay text check (data_delay in ('realtime', 'delayed', 'eod', 'unknown')),
  updated_at timestamptz not null default now()
);

create index if not exists alert_subscription_states_user_instrument_idx
  on public.alert_subscription_states (user_id, instrument_id);

alter table public.alert_subscription_states enable row level security;

revoke all on public.alert_subscription_states from anon, authenticated;
grant select, insert, update, delete on public.alert_subscription_states to service_role;
