# Job Description Matching Stub

## Current behavior

The MVP does not accept job descriptions or tailor answers to a role.

## Future feature

Let users paste a job description and rank STAR answers by relevance to the target role.

## Intended interface

- Add a `JobDescription` model with text, company, role, and imported date.
- Add matching scores and rationale for `StarResponse` records.
- Let the STAR editor use target-role context as optional input.

## Acceptance criteria

- A user can paste a job description and see relevant saved STAR answers.
- Matching explains why an answer is relevant.
- STAR answers can be generated with role-specific emphasis.

## Known constraints

Matching is intentionally deferred to avoid mixing resume extraction quality with role-targeting quality in the first slice.
