alter table public.watchlist_items
  add column if not exists instrument_id text,
  add column if not exists symbol text,
  add column if not exists market text,
  add column if not exists exchange text,
  add column if not exists asset_type text;

update public.watchlist_items
set
  instrument_id = coalesce(instrument_id, item ->> 'instrumentId'),
  symbol = coalesce(symbol, item ->> 'symbol'),
  market = coalesce(market, item ->> 'market'),
  exchange = coalesce(exchange, item ->> 'exchange'),
  asset_type = coalesce(asset_type, item ->> 'assetType')
where instrument_id is null or symbol is null or market is null or asset_type is null;

create index if not exists watchlist_items_instrument_id_idx
  on public.watchlist_items (instrument_id);

create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alerts_enabled boolean not null default true,
  minimum_severity text not null default 'medium'
    check (minimum_severity in ('informational', 'low', 'medium', 'high', 'critical')),
  frequency text not null default 'immediate'
    check (frequency in ('immediate', 'hourly_digest', 'daily_digest', 'disabled')),
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  opportunity_alerts_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  email_consent_at timestamptz,
  email_consent_source text,
  whatsapp_enabled boolean not null default false check (whatsapp_enabled = false),
  monitored_watchlist_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((quiet_hours_start is null) = (quiet_hours_end is null)),
  check (email_enabled = false or email_consent_at is not null)
);

create table if not exists public.alert_rule_versions (
  rule_id text not null,
  version integer not null check (version > 0),
  category text not null,
  definition jsonb not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (rule_id, version)
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument_id text not null,
  instrument_symbol text not null,
  market text not null,
  currency text not null,
  watchlist_id uuid references public.watchlists(id) on delete set null,
  rule_id text not null,
  rule_version integer not null,
  category text not null,
  severity text not null check (severity in ('informational', 'low', 'medium', 'high', 'critical')),
  confidence_score numeric(5, 4) not null check (confidence_score between 0 and 1),
  direction text not null default 'neutral' check (direction in ('up', 'down', 'neutral')),
  title text not null,
  summary text not null,
  localized_content jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  limitations jsonb not null default '[]'::jsonb,
  provider text not null,
  observed_at timestamptz not null,
  fetched_at timestamptz not null,
  freshness_status text not null check (freshness_status in ('fresh', 'stale', 'invalid')),
  deduplication_key text not null,
  status text not null default 'active' check (status in ('active', 'resolved', 'expired', 'dismissed')),
  triggered_at timestamptz not null,
  last_evaluated_at timestamptz not null,
  resolved_at timestamptz,
  expires_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (rule_id, rule_version) references public.alert_rule_versions(rule_id, version)
);

create unique index if not exists alert_events_one_active_rule_idx
  on public.alert_events (user_id, instrument_id, rule_id, direction)
  where status = 'active';
create index if not exists alert_events_user_unread_idx
  on public.alert_events (user_id, triggered_at desc) where read_at is null;
create index if not exists alert_events_user_history_idx
  on public.alert_events (user_id, status, triggered_at desc);
create index if not exists alert_events_deduplication_idx
  on public.alert_events (deduplication_key);

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_event_id uuid not null references public.alert_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'whatsapp')),
  status text not null check (status in ('pending', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (alert_event_id, channel)
);

create index if not exists alert_deliveries_pending_idx
  on public.alert_deliveries (status, scheduled_at) where status = 'pending';

create table if not exists public.alert_job_runs (
  id uuid primary key default gen_random_uuid(),
  window_key text not null unique,
  status text not null check (status in ('running', 'completed', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_users integer not null default 0,
  processed_instruments integer not null default 0,
  created_events integer not null default 0,
  error_count integer not null default 0
);

alter table public.alert_preferences enable row level security;
alter table public.alert_rule_versions enable row level security;
alter table public.alert_events enable row level security;
alter table public.alert_deliveries enable row level security;
alter table public.alert_job_runs enable row level security;

create policy "Users can select own alert preferences"
  on public.alert_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert own alert preferences"
  on public.alert_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id and whatsapp_enabled = false);
create policy "Users can update own alert preferences"
  on public.alert_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and whatsapp_enabled = false);

create policy "Users can select own alert events"
  on public.alert_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can mark own alert events as read"
  on public.alert_events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can select own alert deliveries"
  on public.alert_deliveries for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.alert_preferences from anon, authenticated;
revoke all on public.alert_events from anon, authenticated;
revoke all on public.alert_deliveries from anon, authenticated;
revoke all on public.alert_rule_versions from anon, authenticated;
revoke all on public.alert_job_runs from anon, authenticated;

grant select, insert, update, delete on public.watchlists to authenticated;
grant select, insert, update, delete on public.watchlist_items to authenticated;
grant select, insert, update on public.alert_preferences to authenticated;
grant select on public.alert_events to authenticated;
grant update (read_at) on public.alert_events to authenticated;
grant select on public.alert_deliveries to authenticated;
