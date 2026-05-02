# UAE Diabetes Research Platform — Build Guide: Phase 1 (Foundation)

This is your step-by-step plan for the first ~1–2 weeks. Do these steps in order. Don't skip the security pieces — they're hard to retrofit.

**At the end of Phase 1 you will have:**
- A monorepo on GitHub with three app folders (web, twin, ingest)
- A Supabase project with auth, three roles, RLS turned on, and the base schema
- A Next.js shell deployed to Netlify with Supabase login working
- Cursor configured with project rules so it understands your stack
- One working ingestion job pulling MOHAP open data into Supabase

---

## Step 0 — Prerequisites

Install on your machine:
- **Node.js 20 LTS or newer** — https://nodejs.org
- **pnpm** — `npm install -g pnpm`
- **Supabase CLI** — `npm install -g supabase` (or `brew install supabase/tap/supabase` on Mac)
- **Git** — https://git-scm.com
- **Cursor** — https://cursor.com (you have this)

Have ready in browser tabs:
- GitHub (signed in)
- Supabase dashboard (https://supabase.com/dashboard)
- Netlify dashboard (https://app.netlify.com)

Pick a project name. I'll use `uae-diabetes-platform` in examples — substitute yours.

---

## Step 1 — Create the GitHub repo

1. Go to GitHub → New repository
2. Name: `uae-diabetes-platform`
3. **Private** (this will hold health-related code; never make public)
4. Add a README, MIT or Apache-2.0 license, Node `.gitignore`
5. Create repository
6. On your machine:

```bash
cd ~/projects        # or wherever you keep code
git clone https://github.com/YOUR_USERNAME/uae-diabetes-platform.git
cd uae-diabetes-platform
```

---

## Step 2 — Initialize the monorepo

Run these commands inside the repo:

```bash
# Create the workspace structure
mkdir -p apps/web apps/twin apps/ingest packages/db packages/shared supabase/migrations docs

# Initialize root package.json
pnpm init

# Create pnpm workspace config
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Create .nvmrc so everyone uses the same Node version
echo "20" > .nvmrc
```

Edit the root `package.json` so it has:

```json
{
  "name": "uae-diabetes-platform",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:twin": "cd apps/twin && uvicorn main:app --reload",
    "db:diff": "supabase db diff",
    "db:push": "supabase db push",
    "types": "supabase gen types typescript --linked > packages/db/types.ts"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

Commit:

```bash
git add .
git commit -m "chore: initialize monorepo structure"
git push
```

---

## Step 3 — Create the Supabase project

1. Supabase dashboard → **New project**
2. Name: `uae-diabetes-platform`
3. **Region: choose `me-central-1` (UAE) or `eu-central-1` (Frankfurt)** — keep data close to UAE for both latency and any future data residency rules
4. Generate a strong database password — save it in your password manager
5. Wait ~2 min for the project to provision
6. From Project Settings → API, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (treat this like a password — never commits, never frontend)

Link the CLI to your project:

```bash
# In the repo root
supabase login                                # opens browser
supabase link --project-ref YOUR_PROJECT_REF  # ref is in the project URL
supabase init                                 # creates supabase/ config
```

Create `.env.local` in the repo root (this is gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Add `.env.local` and `.env*.local` to `.gitignore` if not already there.

---

## Step 4 — Drop in the Cursor project rules

Copy the `.cursorrules` file from this bundle into the **root of your repo**. Then in Cursor:

- Open the repo folder (`File → Open Folder`)
- Cursor will auto-detect `.cursorrules` and use it as system context for every chat in this project
- Open the Cursor command palette → "Index Codebase" so it builds an index

This file tells Cursor your stack, conventions, security rules, and the things it must never do (log PHI, bypass RLS, hardcode secrets, etc.).

---

## Step 5 — Apply the initial database schema

Copy `001_initial_schema.sql` from this bundle into `supabase/migrations/` (rename it to include a timestamp):

```bash
mv 001_initial_schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql
```

Push it to Supabase:

```bash
supabase db push
```

Verify in the Supabase dashboard → Table Editor — you should see the `external`, `clinical`, and `research` schemas with tables.

Generate TypeScript types from the schema:

```bash
pnpm types
```

This writes `packages/db/types.ts`. Cursor will now autocomplete every table and column name in your TS code.

---

## Step 6 — Set up auth roles and RLS

The migration in Step 5 already created RLS policies. Now configure auth in the Supabase dashboard:

1. **Authentication → Providers** — enable Email (password + magic link). Add Google OAuth later if you want.
2. **Authentication → URL Configuration** — set Site URL to `http://localhost:3000` for now; add the Netlify URL once deployed.
3. **Authentication → Email Templates** — customize to identify your platform (helps with deliverability).

Test the role assignment by running this in SQL Editor (replace email with your own test account after signing up):

```sql
-- After you sign up via the app, promote yourself to researcher for testing
update public.user_profiles
set role = 'researcher'
where email = 'your-email@example.com';
```

---

## Step 7 — Initialize the Next.js web app

Use Cursor for this (see `cursor_prompts.md` → Prompt 1). Or run manually:

```bash
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*"
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D @types/node
```

Create `apps/web/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

Create `apps/web/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )
}
```

Symlink env file so Next.js sees it:

```bash
cd apps/web
ln -s ../../.env.local .env.local
```

Run it:

```bash
pnpm dev
```

Open `http://localhost:3000` — you should see the default Next.js page.

---

## Step 8 — Deploy to Netlify

1. Netlify dashboard → **Add new site → Import from Git**
2. Pick GitHub → choose `uae-diabetes-platform`
3. Build settings:
   - **Base directory:** `apps/web`
   - **Build command:** `pnpm build`
   - **Publish directory:** `apps/web/.next`
4. Environment variables (Site settings → Environment):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Do NOT** add `SUPABASE_SERVICE_ROLE_KEY` here (frontend only — never the service role)
5. Install the Netlify Next.js plugin if prompted
6. Deploy

Once deployed, copy the Netlify URL and add it to:
- Supabase → Authentication → URL Configuration → Redirect URLs
- Supabase → Authentication → Site URL (production)

---

## Step 9 — Build the first ingestion function

In Cursor, open `apps/ingest/` and use Prompt 4 from `cursor_prompts.md`. The function will:

- Fetch diabetes prevalence data from MOHAP open data portal
- Normalize it into `external.mohap_diabetes_prevalence`
- Run on a schedule via Supabase cron (`pg_cron`)

You'll deploy it as a Supabase Edge Function:

```bash
supabase functions new ingest-mohap
# Cursor writes the code into supabase/functions/ingest-mohap/index.ts
supabase functions deploy ingest-mohap
```

Then schedule it from the Supabase SQL Editor:

```sql
select cron.schedule(
  'ingest-mohap-daily',
  '0 2 * * *',  -- 2 AM UTC daily
  $$
  select net.http_post(
    url := 'https://YOUR_REF.functions.supabase.co/ingest-mohap',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_key'))
  );
  $$
);
```

---

## Verification checklist

By the end of Phase 1, all of these should be true:

- [ ] You can sign up and log in on the deployed Netlify site
- [ ] After login, your row appears in `public.user_profiles` with a default role
- [ ] You can promote yourself to `researcher` via SQL editor
- [ ] As a non-researcher, querying `research.*` views from the client returns nothing (RLS working)
- [ ] As a researcher, the same query returns data
- [ ] `external.mohap_diabetes_prevalence` has at least one row after the ingestion runs
- [ ] `pnpm types` produces no errors and Cursor autocompletes table names
- [ ] No secrets are in git history (`git log -p | grep -i 'service_role'` returns nothing)

---

## What's next (Phase 2 preview)

Once Phase 1 is solid, Phase 2 covers:

1. The Python twin service skeleton (FastAPI on Modal or Fly.io)
2. CGM file upload + parsing (Libre/Dexcom CSV)
3. The clinician dashboard with a patient list + timeline
4. The patient self-entry forms
5. Three more ingestion sources: IDF Atlas, ClinicalTrials.gov, WHO GHO

I'll write that guide when you're ready. Don't start it before Phase 1 is fully verified.

---

## Things to do *outside* the code while Phase 1 is running

These take real-world time so start them now in parallel:

1. **IRB / Ethics application** — pick a host institution (UAEU, MBRU, ICLDC, your hospital) and start the protocol document. Even research-only, non-clinical platforms need ethics review when patient data touches them.
2. **MOHAP / Bayan data access** — the Bayan platform houses the national diabetes registry but isn't openly queryable. Submit an access request as a researcher.
3. **DoH Abu Dhabi / DHA Dubai** — if your patient users are in either emirate, you'll eventually need their approvals for any clinical-twin pilot.
4. **DPO and data classification** — write a short data classification doc (what's PHI, what's de-identified, retention periods). Required for UAE Federal Health Data Law compliance.

Don't let the code get ahead of these — running a clinical pilot without the paperwork is the fastest way to get shut down.
