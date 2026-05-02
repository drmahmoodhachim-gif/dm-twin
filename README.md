# UAE Diabetes Platform (Claude Baseline)

This repository follows the Claude baseline scaffold and Phase 1 setup.

## Workspace layout

- `apps/web` Next.js 15 App Router frontend
- `apps/twin` Python service placeholder
- `apps/ingest` ingestion jobs placeholder
- `packages/db` generated Supabase types
- `packages/shared` shared package placeholder
- `supabase/migrations` SQL migrations

## Helpful commands

- `pnpm dev:web` start web app
- `pnpm --filter web build` build web app
- `pnpm db:push` apply migrations
- `pnpm types` regenerate database types

## Source-of-truth artifacts

- `files/BUILD_GUIDE_PHASE_1.md`
- `files/.cursorrules`
- `files/001_initial_schema.sql`
- `files/cursor_prompts.md`
