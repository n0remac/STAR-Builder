# Follow-up Question Loop Stub

## Current behavior

The STAR answer editor can generate feedback for a draft answer, but follow-up questions and user answers are not persisted.

## Future feature

Persist follow-up questions, user answers, and AI-suggested detail patches. The editor should let users accept suggestions into the relevant STAR sections.

## Intended interface

- Add follow-up records linked to `StarResponse`.
- Store `question`, `answer`, `suggestion`, `status`, and timestamps.
- Add server actions for creating questions, saving answers, and applying suggestions.

## Acceptance criteria

- A user can run follow-ups, answer them later, and see which questions are unresolved.
- Accepted suggestions update the STAR answer without overwriting unrelated fields.
- Follow-up history remains visible on the STAR answer editor.

## Known constraints

This MVP keeps follow-ups stateless to avoid designing the full refinement workflow too early.
