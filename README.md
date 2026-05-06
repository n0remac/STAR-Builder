# STAR MVP

A focused Next.js MVP that turns resume content into job-linked STAR interview answers.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma with SQLite
- OpenAI Responses API with deterministic mock fallback
- Vitest

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate -- --name init
pnpm db:seed
pnpm dev
```

The app works without `OPENAI_API_KEY`; AI tasks return deterministic mock responses. Add `OPENAI_API_KEY` to `.env` to use OpenAI server-side.

Google sign-in uses Auth.js. Add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and
`AUTH_GOOGLE_SECRET` to `.env`; the Google OAuth callback URL is
`/api/auth/callback/google`.

To move existing local data from `local@star.test` to the Google account you
signed in with, run:

```bash
pnpm tsx scripts/claim-existing-data.ts your-google-email@example.com
```

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm prisma:studio
```

## Routes

- `/resume`: paste resume text, extract positions and STAR answer drafts, save items.
- `/profile`: shareable engineer profile with curated experiences, narratives, and resume link.
- `/profile/edit`: local profile settings, curation, and generated summary controls.
- `/profile/publish`: choose the public slug and selected public profile content.
- `/u/[slug]`: public read-only profile for selected content.
- `/jobs`: view and create job cards from resume positions or manual entries.
- `/jobs/[id]`: review a job, add partial STAR answers, and use AI-directed prompts to create drafts.
- `/answers/[id]`: edit a job-linked STAR response opened from a job detail page.
- `/experiences`: redirects to `/jobs`.
- `/star-builder`: redirects to `/jobs`.
