# Architecture Layers

Use layers to keep responsibilities explicit. A file does not need to announce its layer with ceremony, but the code should make the boundary clear.

## Contents

- [Layer 1: Composition Layer](#layer-1-composition-layer)
- [Layer 2: Layout Layer](#layer-2-layout-layer)
- [Layer 3: UI Components](#layer-3-ui-components)
- [Layer 4: Design System And Tailwind Layer](#layer-4-design-system-and-tailwind-layer)
- [Layer 5: Pure Domain/View Functions](#layer-5-pure-domainview-functions)
- [Layer 6: Server Adapters](#layer-6-server-adapters)
- [Layer 7: Client Adapters](#layer-7-client-adapters)

## Layer 1: Composition Layer

Usually:

```txt
page.tsx
layout.tsx
route-level components
```

Responsibilities:

```txt
compose the page
call server reads when appropriate
pass prepared data into components
handle route params and search params
coordinate loading, error, and not-found states
use route layouts for repeated page structure
```

The page is the top-level view orchestrator, not a dumping ground for logic.

## Layer 2: Layout Layer

Layouts define how pages are visually structured.

Examples:

```txt
AppShell
DashboardShell
SettingsLayout
PageContainer
SidebarLayout
TwoColumnLayout
PageHeader
SectionHeader
```

Layouts should own repeated structure:

```txt
navigation
sidebars
headers
footers
content width
major spacing
responsive regions
auth-gated shells
dashboard shells
settings shells
```

Use `layout.tsx` when the structure belongs to a route segment.

```txt
app/
  dashboard/
    layout.tsx
    page.tsx
    jobs/
      page.tsx
    reports/
      page.tsx
```

Use reusable layout components when the structure appears across multiple unrelated routes or inside multiple page types.

```txt
components/
  layout/
    PageContainer.tsx
    PageHeader.tsx
    DashboardShell.tsx
    TwoColumnLayout.tsx
```

Rule:

```txt
Layouts prevent repeated page structure from being copied across pages.
```

## Layer 3: UI Components

Components render specific parts of the view.

Examples:

```txt
JobsTable
RevenueChart
StatusBadge
FilterPanel
CreateJobForm
EmptyState
MetricCard
```

Rules:

```txt
keep components close to the page that owns them
make components small enough to understand
move shared components upward only when reused
prefer props and composition over hidden global state
avoid embedding large data orchestration inside components
```

Components can be server or client components depending on need. Default to server components unless the component needs:

```txt
event handlers
local state
browser APIs
effects
client-only libraries
TanStack Query
interactive UI behavior
```

## Layer 4: Design System And Tailwind Layer

Tailwind is the low-level visual design language.

Use Tailwind directly for:

```txt
local styling
fast iteration
one-off layouts
small route-specific components
simple responsive behavior
```

Extract repeated Tailwind patterns into:

```txt
shared components
layout primitives
class utilities
variant helpers
design primitives
```

Examples of reusable design primitives:

```txt
Button
Card
Panel
Badge
Input
Textarea
Select
Dialog
EmptyState
PageHeader
SectionHeader
```

Repeated class pattern:

```tsx
<div className="rounded-2xl border bg-background p-6 shadow-sm">
```

should eventually become:

```tsx
<Panel>...</Panel>
```

or:

```ts
export const panelClass =
  "rounded-2xl border bg-background p-6 shadow-sm";
```

Rule:

```txt
Tailwind keeps design close to markup, but repeated visual decisions should become reusable primitives.
```

## Layer 5: Pure Domain/View Functions

This is the functional core.

Examples:

```txt
toJobTableRows()
filterJobs()
deriveDashboardStats()
toChartSeries()
validateJobDraft()
prepareCreateJobPayload()
mergeWorkflowState()
```

Responsibilities:

```txt
shape raw data into view models
filter and sort data
derive summaries
prepare mutation payloads
validate assumptions after boundary parsing
keep business and view logic out of TSX
```

These functions should usually be:

```txt
pure
testable
side-effect free
easy to move
easy to reuse from server or client adapters
```

They should not directly call databases, APIs, sessions, browser APIs, or caches.

## Layer 6: Server Adapters

Server adapters connect pure logic to server-side runtime behavior.

Examples:

```txt
Server Components
Server Actions
Route Handlers
database clients
external API clients
gRPC clients
auth/session access
```

Responsibilities:

```txt
fetch data
mutate data
authorize access
validate server boundaries
call pure domain/view functions
revalidate server caches
adapt backend services to frontend needs
```

Server Actions are mainly for:

```txt
form submissions
mutations
client-callable server workflows
create, update, and delete operations
revalidation after writes
```

Route Handlers are used when:

```txt
an HTTP API is needed
external services need access
webhooks are involved
a client hook needs a fetchable endpoint
the boundary should be explicit and network-addressable
```

Server Components are used when:

```txt
data is needed for initial render
SEO or fast first paint matters
data should not be exposed to the client unnecessarily
server-side composition is simpler
```

## Layer 7: Client Adapters

Client adapters connect pure logic to browser/runtime behavior.

Examples:

```txt
custom hooks
TanStack Query hooks
form hooks
URL state hooks
local UI state
browser APIs
```

Responsibilities:

```txt
manage client state
manage cache state
call route handlers or server actions
coordinate interactive UI behavior
call pure functions for client-side transforms
```

Custom hooks are adapters, not the core business logic. A hook may call pure functions, but important domain/view logic should not be trapped inside the hook.
