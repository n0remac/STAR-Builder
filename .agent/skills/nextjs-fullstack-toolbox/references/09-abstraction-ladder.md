# Abstraction Ladder

Use the lowest abstraction that solves the current problem.

## Level 1: Simple Client App

Use when building quickly.

```txt
useEffect
local state
basic fetch
direct Tailwind
simple components
```

## Level 2: Server-Rendered Next.js App

Use when data should load server-side.

```txt
Server Components
server reads
loading.tsx
error.tsx
pure view functions
route layouts
```

## Level 3: Reusable Design And Layout

Use when pages start repeating structure.

```txt
layout.tsx
AppShell
DashboardShell
PageContainer
PageHeader
shared UI primitives
Tailwind class extraction
```

## Level 4: Mutations And Workflows

Use when users change data.

```txt
Server Actions
Zod validation
revalidation
pure mutation preparation functions
```

## Level 5: Interactive Client Cache

Use when client-side server state becomes complex.

```txt
TanStack Query
custom hooks
query option factories
client cache invalidation
optimistic updates
```

## Level 6: Explicit API Boundary

Use when the app needs an HTTP interface.

```txt
Route Handlers
typed request/response contracts
Zod validation
external clients
webhooks
```

## Level 7: Cross-Language Services

Use when parts of the backend need specialization.

```txt
Protobuf
gRPC
Go
Rust
Python
workers
ML services
data pipelines
```

