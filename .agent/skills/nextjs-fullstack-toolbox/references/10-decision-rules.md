# Decision Rules

## Contents

- [Keep Logic In TSX Only When It Is Truly View Logic](#keep-logic-in-tsx-only-when-it-is-truly-view-logic)
- [Use Pure Functions When Logic Needs Reuse Or Tests](#use-pure-functions-when-logic-needs-reuse-or-tests)
- [Use Hooks When The Browser Owns The Behavior](#use-hooks-when-the-browser-owns-the-behavior)
- [Use Server Adapters When The Server Owns The Behavior](#use-server-adapters-when-the-server-owns-the-behavior)
- [Use Layouts When Structure Repeats](#use-layouts-when-structure-repeats)
- [Use Design Primitives When Styling Repeats](#use-design-primitives-when-styling-repeats)
- [Use Protobuf/gRPC When TypeScript Is No Longer Enough](#use-protobufgrpc-when-typescript-is-no-longer-enough)

## Keep Logic In TSX Only When It Is Truly View Logic

Good in TSX:

```txt
conditional rendering
composition
simple display mapping
passing props
layout placement
```

Move out of TSX:

```txt
complex filtering
data shaping
business rules
mutation preparation
validation
derived statistics
large transformations
```

## Use Pure Functions When Logic Needs Reuse Or Tests

A function should move into `_core` when it is:

```txt
non-trivial
reused
worth testing
important to correctness
used by both server and client adapters
```

## Use Hooks When The Browser Owns The Behavior

Use hooks for:

```txt
client cache
browser events
local interaction state
forms
optimistic UI
client-only effects
```

## Use Server Adapters When The Server Owns The Behavior

Use server adapters for:

```txt
auth
database access
secrets
server rendering
mutations
canonical validation
large server-side computation
```

## Use Layouts When Structure Repeats

Use layouts for:

```txt
shared app shells
dashboard sections
settings sections
auth-gated regions
repeated page spacing
navigation structure
responsive page frames
```

## Use Design Primitives When Styling Repeats

Extract design when:

```txt
the same Tailwind classes appear repeatedly
visual consistency matters
the component has semantic meaning
the pattern appears across multiple pages
```

## Use Protobuf/gRPC When TypeScript Is No Longer Enough

Reach for Protobuf/gRPC when:

```txt
multiple languages are involved
service boundaries need to be stable
backend pieces may be rewritten later
ML/data services live in Python
performance services live in Go or Rust
contracts need to outlive implementation details
```
