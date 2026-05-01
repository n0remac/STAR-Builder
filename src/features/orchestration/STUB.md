# Orchestration Stub

## Current behavior

All AI tasks run synchronously from server actions. There is no Trigger.dev or background orchestration.

## Future feature

Move longer-running AI tasks to background jobs if extraction, feedback, or matching become slow enough to hurt UX.

## Intended interface

- Wrap AI task calls in job handlers.
- Store job status and last error for user-visible progress.
- Keep direct server action mocks for tests and local development.

## Acceptance criteria

- Users can start long-running tasks and leave the page without losing progress.
- Failed jobs expose retry actions.
- Job results update the same data models used by synchronous MVP actions.

## Known constraints

Background orchestration is unnecessary until synchronous calls become unreliable or too slow.
