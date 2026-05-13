# Next.js Full-Stack Toolbox

These files are reference material for the `nextjs-fullstack-toolbox` skill. They are split so `SKILL.md` stays concise and agents can load only the relevant reference section for the task.

## Table Of Contents

1. [Philosophy And Core Principles](01-philosophy-and-core-principles.md)
   Defines the overall goal: start simple, colocate by default, keep TSX declarative, keep side effects at the edges, and promote abstractions only when reuse or complexity proves the need.

2. [Architecture Layers](02-architecture-layers.md)
   Describes the main layers in a Next.js app: composition, layouts, UI components, Tailwind/design primitives, pure domain/view functions, server adapters, and client adapters.

3. [Data Fetching And Caching](03-data-fetching-and-caching.md)
   Explains when to start with simple fetching, when to move server-side, when the browser should own server state, and how to choose between Next/server caching and TanStack Query.

4. [Actions, Endpoints, And Hooks](04-actions-endpoints-and-hooks.md)
   Defines the roles of Server Actions, Route Handlers, API endpoints, and custom hooks so mutation, HTTP, and client behavior stay in the right adapter layer.

5. [Design, Layout, And Tailwind](05-design-layout-and-tailwind.md)
   Captures layout rules, design reuse, Tailwind extraction, primitives, and the design abstraction ladder for keeping UI structure centralized without overbuilding early.

6. [Types, Schemas, And Contracts](06-types-schemas-and-contracts.md)
   Clarifies the division between TypeScript, Zod, and Protobuf/gRPC across internal app types, runtime boundaries, and cross-language service contracts.

7. [Backend And Frontend Boundaries](07-backend-and-frontend-boundaries.md)
   Defines backend organization, route-local adapters, explicit operations, frontend orchestration, and the line between view needs and backend authority.

8. [Folder Strategy](08-folder-strategy.md)
   Provides route-local, medium-route, shared-feature, shared-design, and cross-cutting folder examples with the rule to grow into structure gradually.

9. [Abstraction Ladder](09-abstraction-ladder.md)
   Gives a staged growth model from simple client apps through server rendering, reusable design, mutations, client cache, explicit API boundaries, and cross-language services.

10. [Decision Rules](10-decision-rules.md)
    Provides concrete rules for deciding when logic belongs in TSX, `_core`, hooks, server adapters, layouts, design primitives, or Protobuf/gRPC contracts.

11. [Summary](11-summary.md)
    Condenses the full philosophy into a short reference suitable for an overview or quick reminder.
