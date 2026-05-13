# Data Fetching And Caching

## Contents

- [Start Simple](#start-simple)
- [Move Up When Complexity Appears](#move-up-when-complexity-appears)
- [Prefer Server Rendering For Initial Page Data](#prefer-server-rendering-for-initial-page-data)
- [Use Client-Side Data When Interaction Owns The State](#use-client-side-data-when-interaction-owns-the-state)
- [Use URL State For Route-Level UI State](#use-url-state-for-route-level-ui-state)
- [Use Framework/Server Caching For Server-Rendered Data](#use-frameworkserver-caching-for-server-rendered-data)
- [Use TanStack Query For Browser-Owned Server State](#use-tanstack-query-for-browser-owned-server-state)

## Start Simple

For a simple app or prototype, basic approaches are acceptable:

```txt
useEffect
fetch in a client component
local component state
simple server action
direct route handler call
```

This is fine when:

```txt
the page is small
there is little reuse
data is not shared across routes
there are no complex cache requirements
performance does not matter yet
```

## Move Up When Complexity Appears

Use more structure when you see:

```txt
duplicate fetching
shared data across pages
complex filtering and sorting
heavy derived data
large payloads
client/server performance tradeoffs
authorization complexity
cache invalidation problems
cross-language services
```

## Prefer Server Rendering For Initial Page Data

Use server-side reads when:

```txt
the data is needed for initial render
the data should not require client JavaScript
the data depends on auth, session, or server secrets
network payload should be minimized
SEO matters
the page can be rendered mostly server-side
```

## Use Client-Side Data When Interaction Owns The State

Use client adapters or TanStack Query when:

```txt
data is reused across client pages
the UI needs background refetching
optimistic updates are useful
pagination or infinite scroll is client-driven
filters change often without full navigation
polling is needed
multiple components need synchronized client cache
```

## Use URL State For Route-Level UI State

Use search params for state that should be:

```txt
shareable
bookmarkable
reload-safe
back-button friendly
visible in the URL
```

Examples:

```txt
filters
sort order
pagination
selected tab
search query
```

## Use Framework/Server Caching For Server-Rendered Data

Use Next/React/server caching when the problem is:

```txt
duplicated calls in one render
regular page reloads
server-rendered route data
expensive server calculations
stable data shared during rendering
```

## Use TanStack Query For Browser-Owned Server State

Use TanStack Query when the problem is:

```txt
cross-page client cache
stale times
background refetching
manual invalidation
optimistic updates
polling
interactive dashboards
long-lived client sessions
```

Simple rule:

```txt
Next/server caching:
  Can the server reuse this work?

TanStack Query:
  Can the browser coordinate this server state?
```
