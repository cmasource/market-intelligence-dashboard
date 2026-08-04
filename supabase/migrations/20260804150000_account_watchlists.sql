create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists watchlists_user_name_unique
  on public.watchlists (user_id, lower(btrim(name)));

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_key text not null,
  item jsonb not null,
  added_at timestamptz not null default now(),
  unique (watchlist_id, asset_key)
);

create index if not exists watchlist_items_user_id_idx on public.watchlist_items(user_id);
create index if not exists watchlist_items_watchlist_id_idx on public.watchlist_items(watchlist_id);

alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;

create policy "Users can select own watchlists" on public.watchlists for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own watchlists" on public.watchlists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own watchlists" on public.watchlists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own watchlists" on public.watchlists for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own watchlist items" on public.watchlist_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own watchlist items" on public.watchlist_items for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.watchlists where watchlists.id = watchlist_items.watchlist_id and watchlists.user_id = (select auth.uid()))
);
create policy "Users can update own watchlist items" on public.watchlist_items for update to authenticated using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.watchlists where watchlists.id = watchlist_items.watchlist_id and watchlists.user_id = (select auth.uid()))
) with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.watchlists where watchlists.id = watchlist_items.watchlist_id and watchlists.user_id = (select auth.uid()))
);
create policy "Users can delete own watchlist items" on public.watchlist_items for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.watchlists to authenticated;
grant select, insert, update, delete on public.watchlist_items to authenticated;
