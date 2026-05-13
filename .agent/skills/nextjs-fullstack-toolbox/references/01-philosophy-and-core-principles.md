# Philosophy And Core Principles

## Goal

Build apps that start simple, stay understandable, and have a clear path to higher complexity.

Core philosophy:

```txt
Keep side effects at the edges.
Keep most logic as pure functions.
Let the UI describe composition rather than hide orchestration.
```

A simple app can use `useEffect`, local state, direct fetching, and basic components. As complexity grows, the app should naturally evolve toward clearer layers: server adapters, client adapters, pure domain/view functions, typed contracts, reusable layouts, and eventually cross-language service boundaries.

## Start Local, Promote Only When Reuse Proves It

Code should live as close as possible to where it is first used.

```txt
app/
  jobs/
    page.tsx
    _components/
    _actions/
    _hooks/
    _core/
```

Do not create large global directories too early. Promote code upward only when it becomes genuinely shared.

```txt
app/
  dashboard/
  jobs/
  _components/       shared by nearby routes

features/
  jobs/              shared cohesive feature
```

Apply this same rule to components, hooks, actions, schemas, view functions, layouts, and types.

## Functional Core, Adapter Edges

Most logic should be pure and testable.

```txt
Pure core:
  filter data
  transform data
  validate data shape
  derive view models
  calculate summaries
  prepare mutation payloads

Adapter edges:
  server actions
  route handlers
  server components
  client hooks
  TanStack Query
  database calls
  API calls
  browser APIs
```

Side effects should be isolated at boundaries. Pure functions should not directly call databases, APIs, sessions, browser APIs, or caches.

## Keep TSX Close To Markup

Components should mostly describe what is rendered.

```tsx
<JobTable rows={rows} />
```

This is preferable to a table component that fetches, transforms, filters, authorizes, mutates, and renders all in one place.

TSX can contain simple composition and display logic. Complex orchestration should move into pure functions or adapters.

## Centralize Design Through Layouts And Primitives

Layouts define repeated page structure. Tailwind defines the visual language. Pages compose content. Components render focused UI.

Repeated design should be reused through layout components, route layouts, and shared primitives rather than copied across pages.

Use the lowest abstraction that solves the current problem:

```txt
Use raw Tailwind for local, simple, or experimental styling.
Use local components for route-specific repeated pieces.
Use shared primitives for repeated design concepts.
Use route layouts when multiple pages share structure.
Use a design system only when consistency rules need formalization.
```

