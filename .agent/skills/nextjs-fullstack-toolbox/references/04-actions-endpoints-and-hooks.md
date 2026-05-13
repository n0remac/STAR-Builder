# Actions, Endpoints, And Hooks

## Server Actions

Use Server Actions for:

```txt
mutations
forms
button-triggered workflows
server-side updates called from client components
simple app-internal server operations
create, update, and delete operations
revalidation after writes
```

Avoid using Server Actions as the default read/query layer. Reads should usually be server-rendered, fetched from explicit endpoints, or managed through a client cache depending on ownership and complexity.

## Route Handlers And API Endpoints

Use Route Handlers or API endpoints for:

```txt
HTTP APIs
external access
webhooks
mobile or other clients
client hooks that need fetch endpoints
clear network boundaries
```

Use a Route Handler when the boundary should be explicit and network-addressable.

## Hooks

Use hooks for:

```txt
client state
TanStack Query wrappers
form state
browser behavior
view-specific interaction
optimistic UI
client-only effects
```

Hooks should call into pure functions or API adapters. They should not become hidden business-logic containers.

## Adapter Rule

Treat actions, endpoints, and hooks as adapters:

```txt
Server Action:
  connects client-triggered workflows to server behavior

Route Handler:
  exposes an explicit HTTP boundary

Hook:
  connects browser behavior and client cache to pure logic or endpoints
```

Keep durable business/view logic in pure functions so it can be reused from server and client adapters.

