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

## Useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm prisma:studio
```

## Routes

- `/resume`: paste resume text, extract positions and STAR answer drafts, save items.
- `/jobs`: view and create job cards from resume positions or manual entries.
- `/jobs/[id]`: review a job, add partial STAR answers, and use AI-directed prompts to create drafts.
- `/answers/[id]`: edit a job-linked STAR response opened from a job detail page.
- `/experiences`: redirects to `/jobs`.
- `/star-builder`: redirects to `/jobs`.
