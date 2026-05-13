# Backend And Frontend Boundaries

## Contents

- [Backend Organization](#backend-organization)
- [Frontend As Orchestration Layer](#frontend-as-orchestration-layer)

## Backend Organization

Backend code should be abstracted away from the display loop.

Suggested organization:

```txt
lib/
  db/
  auth/
  services/
  repositories/
  clients/
  validators/
  permissions/
  env/
```

Route-local adapters can call into these deeper libraries.

```txt
app/jobs/_server/get-jobs.ts
  calls lib/services/jobs-service.ts
  calls app/jobs/_core/to-job-table-rows.ts
```

Separate:

```txt
data access
business rules
view shaping
validation
permissions
transport adapters
```

Avoid backend classes or hidden service objects that obscure how data is formed. Prefer explicit typed operations:

```txt
ListJobs
GetDashboardData
CreateQuote
RunWorkflow
GenerateReport
```

## Frontend As Orchestration Layer

The frontend can define what data shape a view needs.

For example:

```txt
Dashboard needs:
  recent jobs
  status counts
  chart series
  available filters
  permissions
```

This can be represented as:

```txt
typed request object
Zod schema
Protobuf message
query options
view model contract
```

The frontend may orchestrate composition.

The backend remains authoritative for:

```txt
security
authorization
persistence
canonical business rules
valid state transitions
billing or account rules
tenant boundaries
```

Good distinction:

```txt
Frontend decides:
  What does this view need?

Backend decides:
  Is this allowed, valid, and canonical?
```

The design equivalent:

```txt
Page decides:
  What content appears here?

Layout decides:
  How is this class of page structured?

Design system decides:
  What visual language is reused?
```
