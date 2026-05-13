# Design, Layout, And Tailwind

## Contents

- [Layouts Define Repeated Page Structure](#layouts-define-repeated-page-structure)
- [Tailwind Defines Visual Functions](#tailwind-defines-visual-functions)
- [Centralized Design Should Be Reused](#centralized-design-should-be-reused)
- [Design Abstraction Ladder](#design-abstraction-ladder)

## Layouts Define Repeated Page Structure

Use layouts to keep page structure consistent and centralized.

Good layout responsibilities:

```txt
app shell
dashboard shell
settings shell
auth shell
sidebar/nav structure
main content container
page width
major spacing
responsive regions
header/footer placement
```

Pages should not repeatedly recreate the same shell.

Instead of repeating this across pages:

```tsx
<div className="min-h-screen">
  <Sidebar />
  <TopNav />
  <main className="mx-auto max-w-6xl px-6 py-8">
    ...
  </main>
</div>
```

Prefer:

```tsx
<DashboardShell>
  <PageContainer>
    ...
  </PageContainer>
</DashboardShell>
```

or a route-level `layout.tsx`.

## Tailwind Defines Visual Functions

Tailwind is used for direct styling, spacing, responsive behavior, and visual composition.

Use Tailwind directly when:

```txt
the style is local
the component is experimental
the pattern is not repeated
the design decision is simple
```

Extract Tailwind into a primitive when:

```txt
the same class pattern repeats
visual drift starts appearing
the pattern has semantic meaning
multiple pages should look consistent
```

## Centralized Design Should Be Reused

Shared design belongs in:

```txt
route layouts
layout components
UI primitives
variant utilities
theme tokens
shared class helpers
```

Avoid copying the same layout structure or design pattern into every page.

## Design Abstraction Ladder

Use the lowest design abstraction that solves the current problem.

```txt
Level 1: Direct Tailwind
  One-off or experimental styling.

Level 2: Local component styling
  Route-specific repeated pieces.

Level 3: Shared UI primitives
  Buttons, cards, panels, badges, inputs.

Level 4: Route layouts
  Shared shells for related pages.

Level 5: Design system
  Formalized tokens, variants, theming, and consistency rules.
```

Decision rules:

```txt
Use a layout when:
  multiple pages share structure

Use a component when:
  repeated UI has behavior or semantic meaning

Use a primitive when:
  repeated styling represents a design concept

Use raw Tailwind when:
  styling is local, simple, or experimental

Extract Tailwind classes when:
  repetition creates drift or inconsistency
```
