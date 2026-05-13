# Folder Strategy

## Contents

- [Small Route](#small-route)
- [Medium Route](#medium-route)
- [Larger Shared Feature](#larger-shared-feature)
- [Shared Design](#shared-design)
- [Cross-Cutting App Code](#cross-cutting-app-code)
- [Promotion Rule](#promotion-rule)

Rule:

```txt
Do not start with the large structure. Grow into it.
```

## Small Route

Use a small route structure when the page is early, local, or not yet shared.

```txt
app/
  jobs/
    page.tsx
    loading.tsx
    error.tsx
    _components/
    _core/
```

## Medium Route

Use a medium route structure when a route has real local complexity but is still route-owned.

```txt
app/
  jobs/
    layout.tsx
    page.tsx
    loading.tsx
    error.tsx

    _components/
    _core/
    _server/
    _hooks/
    _types/
```

## Larger Shared Feature

Use a shared feature folder when a cohesive feature is reused across distant routes or surfaces.

```txt
features/
  jobs/
    components/
    core/
    server/
    hooks/
    schemas/
    types/
```

## Shared Design

Use shared design folders for primitives and layout components that represent reusable visual language.

```txt
components/
  ui/
    Button.tsx
    Card.tsx
    Badge.tsx
    Input.tsx

  layout/
    AppShell.tsx
    DashboardShell.tsx
    PageContainer.tsx
    PageHeader.tsx
```

## Cross-Cutting App Code

Use `lib/` for cross-cutting backend and app infrastructure.

```txt
lib/
  db/
  auth/
  env/
  services/
  clients/
  permissions/
  validators/
```

## Promotion Rule

Promote code upward only when reuse or ownership proves it:

```txt
route local:
  first use and route-owned behavior

nearby shared:
  shared by sibling routes or route group

feature shared:
  cohesive domain feature reused across app areas

global shared:
  stable primitives, infrastructure, or cross-cutting services
```
