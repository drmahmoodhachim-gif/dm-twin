-- DM Twin foundational schemas, tables, functions, and RLS policies.

create extension if not exists pgcrypto;

create schema if not exists external;
create schema if not exists clinical;
create schema if not exists research;
create schema if not exists audit;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_clinician_for_patient(target_patient_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from clinical.care_team ct
    where ct.patient_id = target_patient_id
      and ct.clinician_id = auth.uid()
  );
$$;

create table if not exists external.dataset_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  dataset text not null,
  fetched_at timestamptz not null default now(),
  source_url text,
  payload jsonb not null,
  checksum text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_dataset_snapshots_source_dataset_fetched_at
  on external.dataset_snapshots (source, dataset, fetched_at desc);

create table if not exists external.dataset_records (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  dataset text not null,
  snapshot_id uuid references external.dataset_snapshots(id) on delete cascade,
  record_key text not null,
  observed_at timestamptz,
  attributes jsonb not null default '{}'::jsonb,
  normalized jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source, dataset, record_key, snapshot_id)
);

create index if not exists idx_dataset_records_source_dataset
  on external.dataset_records (source, dataset);

create table if not exists clinical.patient_profile (
  patient_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year int,
  sex text,
  diabetes_type text,
  diagnosis_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clinical.care_team (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  clinician_id uuid not null references auth.users(id) on delete cascade,
  relationship text not null default 'primary',
  created_at timestamptz not null default now(),
  unique (patient_id, clinician_id)
);

create table if not exists clinical.cgm_reading (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  device text,
  measured_at timestamptz not null,
  glucose_mg_dl numeric(6,2) not null,
  source text not null default 'manual',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_cgm_patient_measured_at
  on clinical.cgm_reading (patient_id, measured_at desc);

create table if not exists clinical.lab_result (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  loinc_code text,
  test_name text not null,
  value_numeric numeric,
  unit text,
  measured_at timestamptz not null,
  source text not null default 'manual',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_lab_patient_measured_at
  on clinical.lab_result (patient_id, measured_at desc);

create table if not exists clinical.medication_event (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  medication_name text not null,
  dose text,
  route text,
  occurred_at timestamptz not null,
  source text not null default 'manual',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_med_event_patient_occurred_at
  on clinical.medication_event (patient_id, occurred_at desc);

create table if not exists clinical.twin_predictions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  model_name text not null,
  model_version text not null,
  horizon_minutes int,
  input_window_start timestamptz,
  input_window_end timestamptz,
  predicted_at timestamptz not null default now(),
  output jsonb not null,
  explanation jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_twin_predictions_patient_predicted_at
  on clinical.twin_predictions (patient_id, predicted_at desc);

create table if not exists research.cohort_exports (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  cohort_key text not null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  row_count int,
  result jsonb,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists audit.access_log (
  id bigserial primary key,
  actor_id uuid,
  app_role text,
  table_name text not null,
  operation text not null,
  row_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create or replace function audit.log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit.access_log (actor_id, app_role, table_name, operation, row_id, metadata)
  values (
    auth.uid(),
    public.current_app_role(),
    tg_table_schema || '.' || tg_table_name,
    tg_op,
    coalesce(new.id::text, old.id::text),
    '{}'::jsonb
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_cgm_reading on clinical.cgm_reading;
create trigger trg_audit_cgm_reading
after insert or update or delete on clinical.cgm_reading
for each row execute function audit.log_change();

drop trigger if exists trg_audit_lab_result on clinical.lab_result;
create trigger trg_audit_lab_result
after insert or update or delete on clinical.lab_result
for each row execute function audit.log_change();

drop trigger if exists trg_audit_medication_event on clinical.medication_event;
create trigger trg_audit_medication_event
after insert or update or delete on clinical.medication_event
for each row execute function audit.log_change();

drop trigger if exists trg_audit_twin_predictions on clinical.twin_predictions;
create trigger trg_audit_twin_predictions
after insert or update or delete on clinical.twin_predictions
for each row execute function audit.log_change();

alter table clinical.patient_profile enable row level security;
alter table clinical.care_team enable row level security;
alter table clinical.cgm_reading enable row level security;
alter table clinical.lab_result enable row level security;
alter table clinical.medication_event enable row level security;
alter table clinical.twin_predictions enable row level security;
alter table research.cohort_exports enable row level security;

drop policy if exists patient_profile_select on clinical.patient_profile;
create policy patient_profile_select
on clinical.patient_profile
for select
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists patient_profile_insert on clinical.patient_profile;
create policy patient_profile_insert
on clinical.patient_profile
for insert
with check (
  patient_id = auth.uid()
  or public.current_app_role() = 'clinician'
);

drop policy if exists patient_profile_update on clinical.patient_profile;
create policy patient_profile_update
on clinical.patient_profile
for update
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists care_team_select on clinical.care_team;
create policy care_team_select
on clinical.care_team
for select
using (
  patient_id = auth.uid()
  or clinician_id = auth.uid()
);

drop policy if exists care_team_manage_clinician on clinical.care_team;
create policy care_team_manage_clinician
on clinical.care_team
for all
using (public.current_app_role() = 'clinician')
with check (public.current_app_role() = 'clinician');

drop policy if exists cgm_select on clinical.cgm_reading;
create policy cgm_select
on clinical.cgm_reading
for select
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists cgm_insert on clinical.cgm_reading;
create policy cgm_insert
on clinical.cgm_reading
for insert
with check (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists cgm_update on clinical.cgm_reading;
create policy cgm_update
on clinical.cgm_reading
for update
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists cgm_delete on clinical.cgm_reading;
create policy cgm_delete
on clinical.cgm_reading
for delete
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists lab_select on clinical.lab_result;
create policy lab_select
on clinical.lab_result
for select
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists lab_insert on clinical.lab_result;
create policy lab_insert
on clinical.lab_result
for insert
with check (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists lab_update on clinical.lab_result;
create policy lab_update
on clinical.lab_result
for update
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists lab_delete on clinical.lab_result;
create policy lab_delete
on clinical.lab_result
for delete
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists medication_select on clinical.medication_event;
create policy medication_select
on clinical.medication_event
for select
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists medication_insert on clinical.medication_event;
create policy medication_insert
on clinical.medication_event
for insert
with check (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists medication_update on clinical.medication_event;
create policy medication_update
on clinical.medication_event
for update
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists medication_delete on clinical.medication_event;
create policy medication_delete
on clinical.medication_event
for delete
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists twin_predictions_select on clinical.twin_predictions;
create policy twin_predictions_select
on clinical.twin_predictions
for select
using (
  patient_id = auth.uid()
  or public.is_clinician_for_patient(patient_id)
);

drop policy if exists twin_predictions_insert on clinical.twin_predictions;
create policy twin_predictions_insert
on clinical.twin_predictions
for insert
with check (
  public.current_app_role() in ('clinician', 'patient')
  or auth.role() = 'service_role'
);

drop policy if exists cohort_exports_select on research.cohort_exports;
create policy cohort_exports_select
on research.cohort_exports
for select
using (
  requested_by = auth.uid()
  and public.current_app_role() = 'researcher'
);

drop policy if exists cohort_exports_insert on research.cohort_exports;
create policy cohort_exports_insert
on research.cohort_exports
for insert
with check (
  requested_by = auth.uid()
  and public.current_app_role() = 'researcher'
);
