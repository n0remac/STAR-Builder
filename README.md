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

Google sign-in uses Auth.js. Add `AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
and `AUTH_GOOGLE_SECRET` to `.env`. For local development with
`AUTH_URL="http://localhost:3000"`, add this exact authorized redirect URI in
Google Cloud: `http://localhost:3000/api/auth/callback/google`.

Admin ownership repair tools are available at `/admin/ownership` for emails in
`ADMIN_EMAILS`.

To move existing local data from `local@star.test` to the Google account you
signed in with, run:

```bash
pnpm tsx scripts/claim-existing-data.ts your-google-email@example.com
```

If the claim script reports duplicate profiles, inspect and remove the
disposable profile first:

```bash
pnpm tsx scripts/profile-admin.ts list
pnpm tsx scripts/profile-admin.ts delete-profile your-google-email@example.com
```

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:integration
pnpm prisma:studio
```

Integration tests run the user-owned Server Actions against an isolated,
migrated SQLite database under the system temporary directory. Authentication,
redirects, and cache revalidation are mocked; Prisma queries and relations are
real.

## Routes

- `/resume`: paste resume text, extract positions and STAR answer drafts, save items.
- `/profile`: shareable engineer profile with curated experiences, narratives, and resume link.
- `/profile/edit`: local profile settings, curation, and generated summary controls.
- `/profile/publish`: choose the public slug and selected public profile content.
- `/admin/ownership`: admin-only ownership repair console for profiles and saved data.
- `/u/[slug]`: public read-only profile for selected content.
- `/jobs`: view and create job cards from resume positions or manual entries.
- `/jobs/[id]`: review a job, add partial STAR answers, and use AI-directed prompts to create drafts.
- `/answers/[id]`: edit a job-linked STAR response opened from a job detail page.
- `/experiences`: redirects to `/jobs`.
- `/star-builder`: redirects to `/jobs`.
