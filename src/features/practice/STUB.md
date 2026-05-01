# Practice Sessions Stub

## Current behavior

Saved answers can be viewed and copied, but there is no practice session, timer, voice input, or repetition tracking.

## Future feature

Add practice sessions where users rehearse answers, record notes, and track readiness over time.

## Intended interface

- Add `PracticeSession` records linked to `StarResponse`.
- Track prompt, transcript or notes, duration, self-rating, and AI feedback.
- Support voice practice only after text practice is useful.

## Acceptance criteria

- A user can start a practice session from a saved answer.
- The session stores notes and readiness rating.
- Practice history is visible from the answer detail page.

## Known constraints

Voice practice is explicitly out of scope for the MVP boilerplate.
