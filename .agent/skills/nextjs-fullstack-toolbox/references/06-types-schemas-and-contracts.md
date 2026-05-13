# Types, Schemas, And Contracts

## TypeScript For Internal Type Safety

Use TypeScript to keep local app types explicit.

Examples:

```txt
view models
component props
action inputs
route handler responses
domain objects
mutation payloads
layout props
design primitive variants
```

TypeScript describes what should be true inside the trusted TypeScript program.

## Zod For Runtime Boundaries

Use Zod when data crosses an untrusted or runtime boundary.

Good places for Zod:

```txt
form inputs
server action inputs
route handler bodies
URL search params
environment variables
external API responses
webhook payloads
```

TypeScript describes what should be true. Zod verifies what is actually true at runtime.

## Protobuf/gRPC For Cross-Language Boundaries

Use Protobuf/gRPC when the system grows beyond TypeScript or needs typed service contracts across languages.

Use when adding:

```txt
Go services
Rust services
Python ML/data services
long-running workers
high-performance compute
distributed systems
strict service contracts
```

The `.proto` file becomes the shared contract. This allows backend pieces to be moved out of TypeScript without rewriting the frontend orchestration model.

## Contract Rule

Choose the contract tool by boundary:

```txt
TypeScript:
  internal app typing

Zod:
  runtime validation at trust boundaries

Protobuf/gRPC:
  cross-language service contracts
```

