create or replace view public.dataset_snapshots_public as
select id, source, dataset, fetched_at
from external.dataset_snapshots;

grant select on public.dataset_snapshots_public to anon, authenticated;
