grant usage on schema external to anon, authenticated, service_role;

grant select on table external.dataset_snapshots to anon, authenticated;
grant select on table external.dataset_records to anon, authenticated;

grant insert, update, delete on table external.dataset_snapshots to service_role;
grant insert, update, delete on table external.dataset_records to service_role;
