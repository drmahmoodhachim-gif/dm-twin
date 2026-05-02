# Cursor Prompts — UAE Diabetes Platform, Phase 1

These are the exact prompts to give Cursor, in order. Each one assumes the previous one is done. Use **Cmd+L** (Mac) or **Ctrl+L** (Windows/Linux) to open the chat, paste the prompt, and review every change before accepting.

**Important:** Cursor will see your `.cursorrules` automatically — those are your guardrails. The prompts below are the *tasks*.

---

## Prompt 1 — Initialize the Next.js web app

```
Initialize the Next.js app in apps/web following the conventions in .cursorrules.

Requirements:
- Next.js 15 with App Router, TypeScript strict mode, Tailwind, ESLint
- Install @supabase/supabase-js and @supabase/ssr
- Create lib/supabase/client.ts and lib/supabase/server.ts (browser and server clients
  using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Create middleware.ts that refreshes the auth session on every request
- Set up route groups: (researcher), (clinician), (patient) — each with its own layout
- Add a /login page with email + magic link auth (no password yet)
- Add a /api/auth/callback route handler for the magic link flow
- Symlink .env.local from the repo root so envs work in dev
- Use route handler patterns (server components for reads, server actions for writes)

Do NOT:
- Add any UI library beyond what's needed (we'll add shadcn/ui in a later prompt)
- Pick a font yet — leave Tailwind defaults; we'll choose a distinctive font in Prompt 6
- Add any analytics or third-party scripts

After scaffolding, list the files you created and confirm `pnpm dev` runs without errors.
```

---

## Prompt 2 — Wire role-based redirects

```
On /login success, the user should land on a page based on their role from
public.user_profiles. Implement this:

1. Create lib/auth/get-session.ts that returns { user, profile } using the server
   Supabase client. Use the generated types from packages/db/types.ts.
2. Create middleware logic so that:
   - / redirects to /login if not authenticated
   - / redirects to /research if role = 'researcher' or 'admin'
   - / redirects to /clinic if role = 'clinician'
   - / redirects to /me if role = 'patient'
3. Each route group's layout should hard-check the role server-side and
   redirect away if wrong (defense in depth — don't trust middleware alone).
4. Add a sign-out button in a shared TopBar component used by all three layouts.

Show me the diff before making changes. Don't add a UI library yet — plain Tailwind is fine.
```

---

## Prompt 3 — Set up shadcn/ui and the design system

```
Now set up the design system. Read the frontend-design skill if available, otherwise
follow these constraints:

1. Install shadcn/ui (latest, App Router config). Use components.json with:
   - style: new-york
   - baseColor: stone (we'll customize)
   - css variables: yes
2. Pick a distinctive font pair (NOT Inter, NOT Roboto, NOT Geist). For this medical/
   research platform serving UAE clinicians, propose 3 options before installing —
   I want to pick. Suggestions to consider: Söhne / GT America / Neue Haas Grotesk for
   body, paired with something with character for headings (e.g., Editorial New,
   PP Editorial Old, Migra). If we can only use Google Fonts for free, suggest free
   pairings of similar character.
3. Define CSS variables for the theme: --background, --foreground, --primary,
   --accent, --muted, --border, --ring, --critical (for hypo/hyper alerts),
   --warning, --success. Provide both light and dark themes.
4. Add the following shadcn components: Button, Card, Input, Label, Form, Table,
   Tabs, Dialog, Toast (sonner), Skeleton, Avatar, DropdownMenu.
5. Create app/globals.css with the variables and a small set of utility classes
   for clinical contexts: .glucose-in-range, .glucose-high, .glucose-low, .phi-mask
   (for masking sensitive fields).

Stop and ask me to choose the font pair before installing anything.
```

---

## Prompt 4 — Build the MOHAP ingestion Edge Function

```
Create a Supabase Edge Function at supabase/functions/ingest-mohap/index.ts that:

1. Fetches the diabetes prevalence dataset from MOHAP open data portal
   (https://mohap.gov.ae/en/open-data — find the diabetes-prevalence CSV/API endpoint;
   if there's no direct API, fall back to scraping the published CSV file URL).
2. Parses the response into rows matching the
   external.mohap_diabetes_prevalence table schema (year, emirate, age_group, sex,
   prevalence).
3. Upserts rows on the unique key (year, emirate, age_group, sex), updating the
   raw_payload and fetched_at on conflict.
4. Logs a summary row to external.raw_ingestions with status 'normalized' on success
   or 'error' on failure (including the error message in payload).
5. Requires an Authorization header matching env CRON_SECRET — return 401 otherwise.
6. Has a 30s overall timeout and retries the fetch up to 3 times with exponential backoff.

Also write:
- A README in the function folder explaining the endpoint, how to invoke it locally
  (supabase functions serve), and how it's scheduled.
- A small test fixture in __fixtures__/mohap_sample.csv so we can run the parser unit test.
- A unit test for the parser function (use Deno's built-in test runner).

Show the SQL needed to schedule it via pg_cron after deployment, but don't run it
automatically — I'll run it once after deploy.

If the MOHAP portal doesn't have a stable diabetes endpoint, propose an alternative:
either use the IDF Atlas API as a stand-in and rename the function to ingest-idf, or
hardcode the most recent published prevalence figures into a one-time seed migration
and clearly mark it as such in a comment.
```

---

## Prompt 5 — Researcher dashboard skeleton

```
Build the researcher landing page at app/(researcher)/research/page.tsx.

This is the main hub for diabetes researchers. The aesthetic should feel like a
serious research tool — think Bloomberg Terminal meets clinical journal, not a
SaaS landing page. Refer to the frontend-design skill for typography and layout
character.

Page sections (in this order):

1. Header: "UAE Diabetes Research Console" + subline "Aggregated public data,
   cohort tools, and research utilities". Researcher's name and emirate top-right.

2. Stat band — four stat cards pulling live data:
   - National diabetes prevalence (latest year from external.mohap_diabetes_prevalence)
   - Number of patients in clinical cohort (count from research.cohort_overview)
   - Active clinical trials in UAE (will be 0 until ClinicalTrials.gov ingestion exists —
     show "—" with a "data source pending" tooltip)
   - Last data refresh timestamp (max(fetched_at) from external.raw_ingestions)

3. "Data sources" panel — a Table listing all sources from external.raw_ingestions
   grouped by source name, showing: dataset, last fetched, status, row count.
   Initially this will only show MOHAP. Each row has a "View raw" action that opens
   a Dialog showing the JSON payload preview.

4. "Cohort explorer" panel — placeholder for now: a Card titled "Build a Cohort"
   with a disabled button labeled "Coming in Phase 2". Include 2 lines of copy
   explaining what it will do.

5. "Recent literature" panel — placeholder for the PubMed integration. Same
   pattern: titled card, "Coming in Phase 2", brief description.

Implementation notes:
- All data fetching in Server Components using lib/supabase/server.ts
- Use generated types from packages/db/types.ts
- Charts: none yet (Phase 2)
- Loading: Suspense + Skeleton for each panel
- Empty states: every panel must handle "no data yet" gracefully with helpful copy

Show me the file tree first, then the most complex component (the data sources
panel), then the rest.
```

---

## Prompt 6 — Patient onboarding form

```
Build the patient onboarding flow at app/(patient)/me/onboarding/page.tsx.

This is the form a patient fills out the first time they log in. It writes to
clinical.patient_demographics. Required fields per the schema, but the UX should
feel calm, not bureaucratic — this is someone living with diabetes.

Form sections (use shadcn Form + zod):
1. Basic — date of birth, sex, nationality (ISO country dropdown), ethnicity
   (dropdown: Emirati, Arab non-Emirati, South Asian, Southeast Asian, Western,
   African, Other)
2. Diabetes — type (Type 1, Type 2, Gestational, MODY, Prediabetes, Other),
   diagnosis date, height (cm)
3. Optional — Emirates ID (we hash it client-side before sending; show only
   last 4 once saved). Make this optional and explain why we ask.

Validation: zod schema in packages/shared/schemas/patient.ts so we can reuse it
on the API side.

After submit:
- Use a Server Action that re-validates with zod, inserts into
  clinical.patient_demographics with patient_id = auth.uid()
- Redirect to /me on success
- Show field-level errors on validation failure

Important PHI handling: hash the Emirates ID client-side using
crypto.subtle.digest('SHA-256', ...) with a per-tenant salt from a public env
(NEXT_PUBLIC_PHI_SALT). Never send the raw value over the wire. Add a 1-line
comment at the top of the form noting this.

Aesthetic: the patient app should feel warmer than the researcher console —
softer corners, more whitespace, supportive copy. Still no Inter — pick a
humanist sans for body. Refer to the frontend-design skill for direction.
```

---

## Prompt 7 — CGM CSV upload (Libre / Dexcom)

```
Build a CGM CSV upload flow at app/(patient)/me/cgm/upload/page.tsx and the
matching server-side parser.

The user uploads a CSV exported from their CGM app. Support these formats:
- FreeStyle Libre (LibreView export) — columns vary by version; key cols are
  "Device Timestamp" and "Historic Glucose mg/dL" or "Historic Glucose mmol/L"
- Dexcom Clarity export — "Timestamp (YYYY-MM-DDThh:mm:ss)" and "Glucose Value (mg/dL)"

Implementation:
1. Client: drag-and-drop zone, file size limit 10 MB, accept .csv only,
   show parse progress.
2. Parse client-side first using PapaParse for a preview (first 20 rows + total
   count + detected device + date range), shown to the user for confirmation.
3. On confirm, POST the parsed rows to a server action which:
   - Re-validates with zod
   - Detects format from headers
   - Converts mmol/L to mg/dL if needed (× 18.018)
   - Skips rows missing timestamp or glucose
   - Bulk-inserts into clinical.cgm_readings in chunks of 500 rows
   - Returns a summary (inserted, skipped, errors)

4. After upload, redirect to /me/cgm with a success toast and the summary visible.

Edge cases to handle:
- Duplicate readings (same patient, same timestamp): skip silently
- Future timestamps: skip and report
- Negative or > 600 mg/dL values: skip and report (sensor errors)
- Different timezones in the export: convert to UTC for storage

Write a test for the parser using a fixture CSV from each format. Put fixtures
in apps/web/__fixtures__/cgm/.

Do NOT log any glucose values or timestamps to console anywhere in this flow.
```

---

## Prompt 8 — Clinician patient list

```
Build the clinician patient list at app/(clinician)/clinic/page.tsx.

Server Component fetches all patients linked via clinical.care_team where
clinician_id = current user. RLS enforces this automatically.

For each patient, show in a Table:
- Initials avatar (first letter of full name) — never full name in list view by
  default; clinician hovers to reveal (privacy in shoulder-surfing scenarios)
- Diabetes type, age band (5-year), years since diagnosis
- Latest HbA1c (value, date, with color coding: <7% green, 7-8% amber, >8% red)
- Time in Range last 14 days from CGM (% with sparkline)
- Last data point timestamp
- "Open" button → /clinic/patient/[id]

Filters at the top:
- Search by initials/ID (not full name)
- Diabetes type
- HbA1c range
- "Needs attention" toggle (HbA1c >9% OR no data in 30 days OR severe hypo events)

Empty state: "No patients in your care team yet. A patient or admin must add you."

Implementation:
- All queries use the server Supabase client
- TanStack Table for the data table (virtualized; clinicians may have hundreds of patients)
- Sparklines: simple inline SVG, no chart library needed
- Aesthetic: dense, information-rich, like a clinical workstation. Tighter spacing
  than the patient app. Monospace for numeric values.

Show me the type for the patient row first, then the page.
```

---

## After Phase 1 prompts

Once you've worked through Prompts 1–8 and the verification checklist in
`BUILD_GUIDE_PHASE_1.md` passes, ask me for the Phase 2 prompts. Phase 2 covers:

- The Python twin service skeleton (FastAPI + glucose forecaster)
- IDF Atlas + ClinicalTrials.gov + WHO GHO ingestion
- Clinician patient detail page with timeline
- Patient self-entry (food, activity, symptoms)
- The first twin prediction surfaced in the clinician view

---

## How to use these prompts well

1. **Always review every diff** before accepting. Cursor is great but it can hallucinate
   table names or skip the RLS step. Your `.cursorrules` reduces this but doesn't eliminate it.
2. **Run the SQL changes through `supabase db push`** — never edit the database via the
   dashboard, since the migrations file is the source of truth.
3. **Commit after each prompt completes successfully**, with a clear message:
   `feat(web): patient onboarding form (prompt 6)`. This makes rollback trivial.
4. **If a prompt produces too much code at once**, split it: ask Cursor to do part 1
   first, review, commit, then continue.
5. **Open a new chat for each prompt** so context doesn't blur between unrelated tasks.
   Cursor's project-level rules are persistent; the chat-level context shouldn't be.
