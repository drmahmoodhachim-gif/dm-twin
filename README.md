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
