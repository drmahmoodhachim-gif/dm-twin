-- =====================================================================
-- UAE Diabetes Research Platform — Initial Schema
-- Migration 001 — creates schemas, base tables, auth roles, and RLS
-- =====================================================================
-- Run with: supabase db push
-- After running: pnpm types  (regenerates packages/db/types.ts)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";          -- for scheduled ingestion
create extension if not exists "pg_net";           -- for HTTP from cron

-- ---------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------
create schema if not exists external;   -- ingested public data (IDF, MOHAP, WHO, etc.)
create schema if not exists clinical;   -- patient-identifiable data (PHI)
create schema if not exists research;   -- de-identified views for researchers
create schema if not exists audit;      -- access logs

comment on schema external is 'Ingested public-domain reference data. No PHI. Read-open to authenticated users.';
comment on schema clinical is 'Patient health information. RLS-enforced per-patient and per-care-team. Audited.';
comment on schema research is 'De-identified, aggregated views derived from clinical. Researcher access only.';
comment on schema audit is 'Append-only access logs for compliance.';

-- ---------------------------------------------------------------------
-- Roles enum
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('patient', 'clinician', 'researcher', 'admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- User profiles (one row per auth.users entry)
-- ---------------------------------------------------------------------
create table if not exists public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  role         public.user_role not null default 'patient',
  organization text,
  emirate      text,                          -- Abu Dhabi, Dubai, Sharjah, etc.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists user_profiles_role_idx on public.user_profiles(role);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: get current user's role (security definer to bypass RLS)
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- Care teams (which clinicians can see which patients)
-- ---------------------------------------------------------------------
create table if not exists clinical.care_team (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references public.user_profiles(id) on delete cascade,
  clinician_id  uuid not null references public.user_profiles(id) on delete cascade,
  relationship  text not null default 'primary',   -- primary, consulting, etc.
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (patient_id, clinician_id)
);

create index if not exists care_team_patient_idx   on clinical.care_team(patient_id);
create index if not exists care_team_clinician_idx on clinical.care_team(clinician_id);

-- ---------------------------------------------------------------------
-- Patient demographics (separate from auth profile so we can extend later)
-- ---------------------------------------------------------------------
create table if not exists clinical.patient_demographics (
  patient_id            uuid primary key references public.user_profiles(id) on delete cascade,
  date_of_birth         date,
  sex                   text check (sex in ('male', 'female', 'other')),
  nationality           text,                                -- ISO country code
  ethnicity             text,                                -- emirati, south_asian, arab_other, etc.
  emirates_id_hash      text,                                -- hashed, never plaintext
  diabetes_type         text check (diabetes_type in ('type_1', 'type_2', 'gestational', 'mody', 'other', 'prediabetes')),
  diagnosis_date        date,
  height_cm             numeric(5,1),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id)
);

-- ---------------------------------------------------------------------
-- CGM readings
-- ---------------------------------------------------------------------
create table if not exists clinical.cgm_readings (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references public.user_profiles(id) on delete cascade,
  reading_at      timestamptz not null,
  glucose_mg_dl   numeric(5,1) not null,                     -- canonical storage in mg/dL
  device          text,                                       -- libre_2, libre_3, dexcom_g6, dexcom_g7, etc.
  trend           text check (trend in ('rising_fast','rising','stable','falling','falling_fast')),
  source          text not null default 'upload',             -- upload, vendor_api, manual
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

create index if not exists cgm_readings_patient_time_idx
  on clinical.cgm_readings(patient_id, reading_at desc);

-- ---------------------------------------------------------------------
-- Lab results (HbA1c, lipids, kidney, etc.)
-- ---------------------------------------------------------------------
create table if not exists clinical.lab_results (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references public.user_profiles(id) on delete cascade,
  measured_at  timestamptz not null,
  loinc_code   text,                                          -- standardized lab identifier
  test_name    text not null,
  value        numeric not null,
  unit         text not null,
  ref_low      numeric,
  ref_high     numeric,
  source       text default 'manual',
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

create index if not exists lab_results_patient_time_idx
  on clinical.lab_results(patient_id, measured_at desc);

-- ---------------------------------------------------------------------
-- Medications
-- ---------------------------------------------------------------------
create table if not exists clinical.medications (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references public.user_profiles(id) on delete cascade,
  rxnorm_code   text,
  name          text not null,
  dose          text,
  frequency     text,
  started_on    date,
  stopped_on    date,
  prescribed_by uuid references public.user_profiles(id),
  notes         text,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id)
);

create index if not exists medications_patient_idx on clinical.medications(patient_id);

-- ---------------------------------------------------------------------
-- Twin predictions (audit trail of every twin model output)
-- ---------------------------------------------------------------------
create table if not exists clinical.twin_predictions (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references public.user_profiles(id) on delete cascade,
  model_name      text not null,                              -- glucose_forecaster, hba1c_trajectory, etc.
  model_version   text not null,
  predicted_at    timestamptz not null default now(),
  horizon_minutes integer,
  output          jsonb not null,                             -- structured per model
  confidence      jsonb,                                      -- CI bounds, calibration info
  created_at      timestamptz not null default now()
);

create index if not exists twin_predictions_patient_time_idx
  on clinical.twin_predictions(patient_id, predicted_at desc);

-- ---------------------------------------------------------------------
-- External data: MOHAP diabetes prevalence (first ingestion target)
-- ---------------------------------------------------------------------
create table if not exists external.mohap_diabetes_prevalence (
  id            uuid primary key default uuid_generate_v4(),
  year          integer not null,
  emirate       text,
  age_group     text,
  sex           text,
  prevalence    numeric,
  source_url    text not null,
  fetched_at    timestamptz not null default now(),
  raw_payload   jsonb,
  unique (year, emirate, age_group, sex)
);

-- ---------------------------------------------------------------------
-- External data: generic landing zone for any source
-- ---------------------------------------------------------------------
create table if not exists external.raw_ingestions (
  id          uuid primary key default uuid_generate_v4(),
  source      text not null,                                  -- 'idf_atlas', 'who_gho', 'clinicaltrials_gov', etc.
  dataset     text not null,
  fetched_at  timestamptz not null default now(),
  payload     jsonb not null,
  status      text not null default 'pending'                 -- pending, normalized, error
);

create index if not exists raw_ingestions_source_idx on external.raw_ingestions(source, fetched_at desc);

-- ---------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------
create table if not exists audit.access_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid,
  actor_role   public.user_role,
  action       text not null,                -- select, insert, update, delete
  schema_name  text not null,
  table_name   text not null,
  row_id       uuid,
  ip_address   inet,
  details      jsonb
);

create index if not exists access_log_actor_time_idx on audit.access_log(actor_id, occurred_at desc);
create index if not exists access_log_table_time_idx on audit.access_log(schema_name, table_name, occurred_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================

-- user_profiles
alter table public.user_profiles enable row level security;

create policy "users see their own profile"
  on public.user_profiles for select
  using (id = auth.uid());

create policy "researchers and admins see all profiles"
  on public.user_profiles for select
  using (public.current_user_role() in ('researcher', 'admin'));

create policy "users update their own profile"
  on public.user_profiles for update
  using (id = auth.uid());

-- care_team
alter table clinical.care_team enable row level security;

create policy "patients see their care team"
  on clinical.care_team for select
  using (patient_id = auth.uid());

create policy "clinicians see their assigned patients"
  on clinical.care_team for select
  using (clinician_id = auth.uid());

-- patient_demographics
alter table clinical.patient_demographics enable row level security;

create policy "patients see their own demographics"
  on clinical.patient_demographics for select
  using (patient_id = auth.uid());

create policy "patients update their own demographics"
  on clinical.patient_demographics for update
  using (patient_id = auth.uid());

create policy "clinicians see assigned patients' demographics"
  on clinical.patient_demographics for select
  using (
    exists (
      select 1 from clinical.care_team ct
      where ct.patient_id = patient_demographics.patient_id
        and ct.clinician_id = auth.uid()
        and ct.active
    )
  );

-- cgm_readings
alter table clinical.cgm_readings enable row level security;

create policy "patients see own cgm"
  on clinical.cgm_readings for select
  using (patient_id = auth.uid());

create policy "patients insert own cgm"
  on clinical.cgm_readings for insert
  with check (patient_id = auth.uid());

create policy "clinicians see assigned patients' cgm"
  on clinical.cgm_readings for select
  using (
    exists (
      select 1 from clinical.care_team ct
      where ct.patient_id = cgm_readings.patient_id
        and ct.clinician_id = auth.uid()
        and ct.active
    )
  );

-- lab_results — same pattern as cgm_readings
alter table clinical.lab_results enable row level security;

create policy "patients see own labs"
  on clinical.lab_results for select using (patient_id = auth.uid());

create policy "clinicians see assigned patients' labs"
  on clinical.lab_results for select using (
    exists (select 1 from clinical.care_team ct
            where ct.patient_id = lab_results.patient_id
              and ct.clinician_id = auth.uid() and ct.active)
  );

create policy "clinicians insert labs for assigned patients"
  on clinical.lab_results for insert with check (
    exists (select 1 from clinical.care_team ct
            where ct.patient_id = lab_results.patient_id
              and ct.clinician_id = auth.uid() and ct.active)
  );

-- medications — same pattern
alter table clinical.medications enable row level security;

create policy "patients see own meds"
  on clinical.medications for select using (patient_id = auth.uid());

create policy "clinicians see assigned patients' meds"
  on clinical.medications for select using (
    exists (select 1 from clinical.care_team ct
            where ct.patient_id = medications.patient_id
              and ct.clinician_id = auth.uid() and ct.active)
  );

-- twin_predictions
alter table clinical.twin_predictions enable row level security;

create policy "patients see own twin predictions"
  on clinical.twin_predictions for select using (patient_id = auth.uid());

create policy "clinicians see assigned patients' twin predictions"
  on clinical.twin_predictions for select using (
    exists (select 1 from clinical.care_team ct
            where ct.patient_id = twin_predictions.patient_id
              and ct.clinician_id = auth.uid() and ct.active)
  );

-- external.* — open read to any authenticated user, write only by admin/service
alter table external.mohap_diabetes_prevalence enable row level security;
create policy "auth users read mohap"
  on external.mohap_diabetes_prevalence for select
  using (auth.role() = 'authenticated');

alter table external.raw_ingestions enable row level security;
create policy "researchers and admins read raw ingestions"
  on external.raw_ingestions for select
  using (public.current_user_role() in ('researcher', 'admin'));

-- audit.access_log — admins only, read only (writes via trigger)
alter table audit.access_log enable row level security;
create policy "admins read audit log"
  on audit.access_log for select
  using (public.current_user_role() = 'admin');

-- =====================================================================
-- Research-only de-identified views
-- These views k-anonymize and aggregate; researchers query these,
-- never the underlying clinical tables.
-- =====================================================================

create or replace view research.cohort_overview
with (security_invoker = true)
as
select
  date_trunc('month', d.diagnosis_date)::date as diagnosis_month,
  d.diabetes_type,
  d.sex,
  d.ethnicity,
  case
    when extract(year from age(d.date_of_birth)) >= 90 then '90+'
    else (floor(extract(year from age(d.date_of_birth)) / 5) * 5)::text || '-'
       || (floor(extract(year from age(d.date_of_birth)) / 5) * 5 + 4)::text
  end as age_band,
  count(*) as n
from clinical.patient_demographics d
group by 1, 2, 3, 4, 5
having count(*) >= 5;   -- k-anonymity threshold

grant usage on schema research to authenticated;
grant select on research.cohort_overview to authenticated;

-- Restrict view access to researchers only via a row-level filter on the underlying join
-- (handled by RLS on patient_demographics — clinicians only see their own patients,
-- so the aggregate count meaningfully only fires for researchers via security definer)
-- For a stricter version, wrap this in a security definer function gated by role.

-- =====================================================================
-- Audit triggers (write to audit.access_log on every insert/update/delete on clinical.*)
-- =====================================================================
create or replace function audit.log_clinical_change()
returns trigger
language plpgsql
security definer
as $$
declare
  row_id_val uuid;
begin
  begin
    row_id_val := coalesce((new).id, (old).id);
  exception when others then
    row_id_val := null;
  end;

  insert into audit.access_log(actor_id, actor_role, action, schema_name, table_name, row_id, details)
  values (
    auth.uid(),
    public.current_user_role(),
    lower(tg_op),
    tg_table_schema,
    tg_table_name,
    row_id_val,
    jsonb_build_object('op', tg_op)
  );

  return coalesce(new, old);
end; $$;

-- Attach the audit trigger to clinical tables
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'clinical'
  loop
    execute format(
      'drop trigger if exists audit_%I on clinical.%I;
       create trigger audit_%I
         after insert or update or delete on clinical.%I
         for each row execute function audit.log_clinical_change();',
      t, t, t, t
    );
  end loop;
end $$;

-- =====================================================================
-- Done.
-- After applying:
--   1. Sign up a test user via the Next.js app
--   2. In SQL editor: update public.user_profiles set role='researcher' where email='you@x.com';
--   3. Run pnpm types
-- =====================================================================
