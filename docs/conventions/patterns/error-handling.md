# Error Handling

This document describes the domain error system used across the monorepo.

## Overview

Domain errors are typed exceptions that represent business-level failures. They live in the domain layer (`@dfs/common/domain`) and are automatically translated to TRPC errors by middleware in the API layer.

## Error Hierarchy

All domain errors extend the abstract `DomainError` class:

```typescript
abstract class DomainError extends Error {
  public readonly code: string
  public readonly metadata?: Record<string, unknown>
  public abstract readonly statusCode: number
}
```

### Available Error Types

| Error Class | Status Code | TRPC Code | Default Code | When to Use |
|-------------|-------------|-----------|--------------|-------------|
| `ValidationError` | 400 | `BAD_REQUEST` | `VALIDATION_ERROR` | Invalid input, format errors, missing required fields |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | `UNAUTHORIZED` | Missing or invalid authentication |
| `ForbiddenError` | 403 | `FORBIDDEN` | `FORBIDDEN` | User authenticated but lacks permission |
| `NotFoundError` | 404 | `NOT_FOUND` | `NOT_FOUND` | Resource does not exist |
| `ConflictError` | 409 | `CONFLICT` | `CONFLICT` | Resource already exists, duplicate entries |
| `BusinessRuleError` | 422 | `UNPROCESSABLE_CONTENT` | `BUSINESS_RULE_VIOLATION` | Business logic violations |

## Usage in Services

### Application Services

```typescript
import { NotFoundError, ValidationError } from '@dfs/common/domain'

export class UserUpdater {
  constructor(private readonly repo: UserRepository) {}

  async run(input: UserDto) {
    if (!input.id) throw new ValidationError('Missing user id', 'id')

    const user = await this.repo.findById(Uuid.fromString(input.id))
    if (!user) throw NotFoundError.withId('User', input.id)

    user.update(input)
    return this.repo.save(user)
  }
}
```

### Value Objects

```typescript
import { ValidationError } from '../errors/validation.error'

export class Email {
  static fromString(value: string) {
    if (!Email.isValidIdentifier(value)) {
      throw ValidationError.invalidFormat('email', value)
    }
    return new Email(value)
  }
}
```

### Business Rule Violations

```typescript
import { BusinessRuleError, ConflictError, ForbiddenError } from '@dfs/common/domain'

// Duplicate resource
throw ConflictError.alreadyExists('User', email)

// Permission denied
throw ForbiddenError.insufficientPermissions('delete users')

// Custom business rule
throw new BusinessRuleError('Order cannot be cancelled after shipping', 'ORDER_ALREADY_SHIPPED', {
  orderId,
  status: order.status
})
```

## Static Factory Methods

Some errors provide static factory methods for common scenarios:

- `ValidationError.invalidFormat(field, value)` — Invalid format for a field
- `NotFoundError.withId(resource, id)` — Resource not found by ID
- `ConflictError.alreadyExists(resource, identifier)` — Duplicate resource
- `ForbiddenError.insufficientPermissions(action)` — Missing permission for action

## Extending with Domain-Specific Errors

Bounded contexts can create their own errors by extending base domain errors:

```typescript
// packages/auth/domain/errors/disposable-email.error.ts
import { ForbiddenError } from '@dfs/common/domain'

export class DisposableEmailError extends ForbiddenError {
  constructor(email: string, domain: string) {
    super('Registration is not allowed from disposable email domains', {
      email,
      domain,
      reason: 'disposable_domain'
    })
  }
}
```

Extended errors are automatically handled by the TRPC middleware because they inherit from base domain errors.

## TRPC Integration

### How It Works

1. Application services throw domain errors
2. `domainErrorMiddleware` catches them in the TRPC procedure chain
3. `mapDomainErrorToTRPC()` translates each domain error to a `TRPCError` with the correct code
4. The error formatter extracts `errorCode` and `metadata` into the response shape

### Error Response Shape

```json
{
  "error": {
    "message": "User with identifier \"abc-123\" not found",
    "code": -32004,
    "data": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errorCode": "NOT_FOUND",
      "metadata": { "id": "abc-123" }
    }
  }
}
```

## What NOT to Use Domain Errors For

- **Infrastructure failures** (database down, network timeout): Let these bubble up as unhandled errors; the mapper converts them to `INTERNAL_SERVER_ERROR`
- **Programming bugs** (null reference, type mismatch): Fix the code instead of wrapping in a domain error
- **TRPC-specific concerns** (auth in middleware): Use `TRPCError` directly in TRPC middleware; the mapper passes them through unchanged

## File Locations

| File | Location |
|------|----------|
| Base class + concrete errors | `packages/common/domain/errors/` |
| Barrel export | `packages/common/domain/errors/index.ts` |
| TRPC mapper | `packages/common/infrastructure/trpc/domain-error-mapper.ts` |
| TRPC middleware | `packages/api/src/core/middleware.ts` |
| Tests | `packages/common/domain/errors/domain-error.test.ts` |
| Mapper tests | `packages/common/infrastructure/trpc/domain-error-mapper.test.ts` |
