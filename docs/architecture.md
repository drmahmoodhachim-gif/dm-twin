# DM Twin Architecture (Phase 1)

This repository is the foundation for a diabetes research and clinical digital twin platform on:
- Netlify (frontend deployment)
- Supabase (auth, postgres, storage, edge functions)
- External ML service (Python FastAPI, separate runtime)

## System Layers

### 1) Research Aggregation Layer
- Scheduled Supabase Edge Functions ingest external datasets (MOHAP, IDF, WHO, ClinicalTrials, etc.).
- Raw snapshots are saved in `external.dataset_snapshots` as JSONB.
- Optional normalized rows are stored in `external.dataset_records`.
- Researchers query a unified model instead of source-specific payloads.

### 2) Clinical Twin Layer
- Patient and clinician data flows into `clinical.*`.
- Role-gated access is enforced with RLS:
  - `patient`: own records only
  - `clinician`: only patients linked in `clinical.care_team`
  - `researcher`: no direct access to PHI tables
- Twin inference is executed by a separate Python service.
- Predictions are persisted in `clinical.twin_predictions` with model/version metadata.

### 3) Frontend Layer
- Current app is a single web frontend.
- Planned split:
  - `/research` (research dashboard)
  - `/clinic` (clinician workspace)
  - `/me` (patient portal)

## Data Model (Phase 1)

Schemas:
- `public`: shared lookup/utility
- `external`: ingested external data
- `clinical`: patient-facing clinical data
- `research`: de-identified researcher views
- `audit`: access/audit trails

Key tables added in migration:
- `external.dataset_snapshots`
- `external.dataset_records`
- `clinical.patient_profile`
- `clinical.care_team`
- `clinical.cgm_reading`
- `clinical.lab_result`
- `clinical.medication_event`
- `clinical.twin_predictions`
- `audit.access_log`

## Security Baseline

- RLS enabled by default on all `clinical.*` and `research.cohort_exports`.
- JWT role claims:
  - `raw_app_meta_data.role = patient | clinician | researcher`
- Policies:
  - patient can read/write own records
  - clinician can read/write linked patient records
  - researcher can read only de-identified research outputs
- DB helper functions:
  - `public.current_app_role()`
  - `public.is_clinician_for_patient(uuid)`
- Access audit trigger writes to `audit.access_log`.

## Next Implementation Steps

1. Add de-identification materialized views under `research.*`.
2. Add scheduled jobs (`pg_cron`) for each source ingestion function.
3. Add `apps/twin` Python service and signed service-to-service auth.
4. Add typed DB client generation and repository boundaries.
