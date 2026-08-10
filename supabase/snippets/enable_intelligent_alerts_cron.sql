-- Run only for the Supabase Cron strategy. Do not enable this together with Vercel Cron.
-- Create both values first in Supabase Vault:
--   cma_alerts_endpoint_url = https://your-production-host/api/alerts/evaluate
--   cma_alerts_cron_secret = the same random value configured as CRON_SECRET in the app

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  missing_secrets text[];
  existing_job record;
begin
  select array_agg(required.name)
    into missing_secrets
  from (values ('cma_alerts_endpoint_url'), ('cma_alerts_cron_secret')) as required(name)
  where not exists (
    select 1 from vault.decrypted_secrets secret where secret.name = required.name
  );

  if missing_secrets is not null then
    raise exception 'Missing required Vault secrets: %', array_to_string(missing_secrets, ', ');
  end if;

  for existing_job in
    select jobid from cron.job
    where jobname in ('evaluate-intelligent-alerts-hourly', 'evaluate-intelligent-alerts-five-minutes')
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'evaluate-intelligent-alerts-five-minutes',
    '*/5 * * * *',
    $command$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'cma_alerts_endpoint_url'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cma_alerts_cron_secret')
        ),
        body := jsonb_build_object('scheduler', 'supabase_cron'),
        timeout_milliseconds := 60000
      );
    $command$
  );
end
$$;
