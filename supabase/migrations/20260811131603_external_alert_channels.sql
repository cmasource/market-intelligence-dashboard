alter table public.alert_preferences
  drop constraint if exists alert_preferences_whatsapp_enabled_check;

alter table public.alert_preferences
  add column if not exists whatsapp_phone_e164 text,
  add column if not exists whatsapp_consent_at timestamptz,
  add column if not exists whatsapp_consent_source text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'alert_preferences_whatsapp_consent_check'
      and conrelid = 'public.alert_preferences'::regclass
  ) then
    alter table public.alert_preferences
      add constraint alert_preferences_whatsapp_consent_check check (
        whatsapp_enabled = false or (
          whatsapp_consent_at is not null
          and whatsapp_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
        )
      );
  end if;
end
$$;

alter table public.alert_deliveries
  add column if not exists provider_message_id text,
  add column if not exists provider_status text;

drop policy if exists "Users can insert own alert preferences" on public.alert_preferences;
create policy "Users can insert own alert preferences"
  on public.alert_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own alert preferences" on public.alert_preferences;
create policy "Users can update own alert preferences"
  on public.alert_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
