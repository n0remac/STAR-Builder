---
name: nextjs-fullstack-toolbox
description: Apply Cameron's Next.js full-stack architecture philosophy when planning, reviewing, refactoring, or implementing Next.js App Router code. Use for decisions about colocated folders, server/client boundaries, Server Actions, Route Handlers, hooks, TanStack Query, Tailwind/layout primitives, pure domain/view functions, TypeScript/Zod/protobuf contracts, backend organization, and abstraction level.
---

# Next.js Full-Stack Toolbox

Use this skill to keep Next.js App Router work aligned with Cameron's full-stack architecture philosophy.

## Core Workflow

1. Inspect the local code first. Let the current route, component, data, and folder shape guide the smallest useful change.
2. Choose the lowest abstraction that solves the current problem. Colocate first; promote only when reuse or ownership proves it.
3. Keep side effects at adapter edges. Put durable view, domain, validation, shaping, and payload logic in pure functions.
4. Keep TSX declarative. Components should describe composition and rendering, not hide data orchestration.
5. Use server adapters for server-owned behavior and client adapters for browser-owned behavior.
6. Centralize repeated structure through route layouts, layout components, and design primitives instead of copying shells or Tailwind patterns.

## Reference Map

Load only the reference files relevant to the current task:

- [Table of contents](references/TABLE_OF_CONTENTS.md): Brief description of every reference section.
- [Philosophy and core principles](references/01-philosophy-and-core-principles.md): Colocation, functional core, adapter edges, declarative TSX, and design centralization.
- [Architecture layers](references/02-architecture-layers.md): Composition, layout, UI, Tailwind/design, pure functions, server adapters, and client adapters.
- [Data fetching and caching](references/03-data-fetching-and-caching.md): Server reads, client data ownership, URL state, Next/server caching, and TanStack Query.
- [Actions, endpoints, and hooks](references/04-actions-endpoints-and-hooks.md): Server Actions, Route Handlers, API endpoints, and hooks as adapters.
- [Design, layout, and Tailwind](references/05-design-layout-and-tailwind.md): Layout reuse, Tailwind extraction, primitives, and design abstraction levels.
- [Types, schemas, and contracts](references/06-types-schemas-and-contracts.md): TypeScript, Zod, and Protobuf/gRPC boundary decisions.
- [Backend and frontend boundaries](references/07-backend-and-frontend-boundaries.md): Backend organization, frontend orchestration, and authority boundaries.
- [Folder strategy](references/08-folder-strategy.md): Small routes, medium routes, shared features, shared design, and cross-cutting app code.
- [Abstraction ladder](references/09-abstraction-ladder.md): Growth path from simple client apps to cross-language services.
- [Decision rules](references/10-decision-rules.md): Concrete rules for moving logic among TSX, core, hooks, server adapters, layouts, primitives, and service contracts.
- [Summary](references/11-summary.md): Compact philosophy recap.

