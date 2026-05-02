# UAE Diabetes Platform (Claude Baseline Reset)

This repository has been reset to the Claude baseline scaffold.

Authoritative baseline artifacts are in:
- `files/BUILD_GUIDE_PHASE_1.md`
- `files/.cursorrules`
- `files/001_initial_schema.sql`
- `files/cursor_prompts.md`

Follow the build guide steps in order to continue implementation.
# DM Twin

Standalone React + TypeScript + Vite project configured for:

- GitHub source control
- Netlify deployment
- Supabase integration

## Run locally

1. Copy `.env.example` to `.env`
2. Add your Supabase values in `.env`
3. Install dependencies and start dev server:

```bash
npm install
npm run dev
```

## Environment variables

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Build and deploy

Netlify config is in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`

## Supabase foundation

This repo now includes:

- `supabase/migrations/20260502191500_foundation.sql`
- `supabase/functions/mohap-ingest/index.ts`
- `docs/architecture.md`

Run the SQL migration in your Supabase project (SQL editor or CLI migration flow), then deploy the edge function.

Required edge function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOHAP_DIABETES_SOURCE_URL` (optional override)
