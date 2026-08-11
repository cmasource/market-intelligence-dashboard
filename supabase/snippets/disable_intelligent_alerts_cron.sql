-- Safe scheduler rollback. Alert tables and history are retained.
do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in ('evaluate-intelligent-alerts-hourly', 'evaluate-intelligent-alerts-five-minutes')
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end
$$;
