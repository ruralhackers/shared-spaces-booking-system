# Naming Conventions

This document defines the naming conventions used throughout the monorepo, inspired by PromptHero's best practices.

## File Naming

### Pattern: `kebab-case.type.ts`

Files should follow kebab-case naming with a clear type suffix:

```
✅ Good
user-creator.service.ts
user-finder.service.ts
prompt-model.repository.ts
user-updater.controller.ts
replicate-prediction-generator.adapter.ts

❌ Bad
UserCreator.service.ts
userCreator.service.ts
user_creator.service.ts
```

### File Type Suffixes

| Type | Suffix | Example |
|------|--------|---------|
| Domain Entities | `.entity.ts` | `user.entity.ts`, `prompt.entity.ts` |
| Value Objects | `.vo.ts` | `email.vo.ts`, `id.vo.ts` |
| DTOs | `.dto.ts` | `user.dto.ts`, `prompt.dto.ts` |
| Services | `.service.ts` | `user-creator.service.ts` |
| Repositories | `.repository.ts` | `user-prisma.repository.ts` |
| Controllers | `.controller.ts` | `user-updater.controller.ts` |
| Adapters | `.adapter.ts` | `email-sender.adapter.ts` |
| Factories | `.factory.ts` | `user.factory.ts` |

## Class Naming

### Pattern: `PascalCase`

Classes should use PascalCase and clearly express their purpose:

```typescript
✅ Good
export class UserCreator { }
export class PromptFinder { }
export class UserPrismaRepository { }
export class EmailSenderAdapter { }

❌ Bad
export class userCreator { }
export class User_Creator { }
export class user_creator { }
```

### Class Naming Patterns

| Layer | Pattern | Examples |
|-------|---------|----------|
| Domain Services | `[Entity][Action]` | `UserValidator`, `PromptGenerator` |
| Application Services | `[Entity][Action]` | `UserCreator`, `PromptFinder` |
| Repositories | `[Entity]PrismaRepository` | `UserPrismaRepository` |
| Controllers | `[Entity][Action]Controller` | `UserUpdaterController` |
| Adapters | `[Service][Provider]Adapter` | `EmailSendgridAdapter` |
| Factories | `[Entity]Factory` | `UserFactory`, `PromptFactory` |

## Method Naming

### Pattern: `camelCase`

Methods should use camelCase with descriptive, action-oriented names:

```typescript
✅ Good
class UserCreator {
  async run(input: CreateUserInput) { }  // Main entry point
  private validateInput(input: CreateUserInput) { }
  private hashPassword(password: string) { }
}

class UserRepository {
  async findById(id: Id) { }
  async save(user: User) { }
  async delete(user: User) { }
  async findByEmail(email: Email) { }
}

❌ Bad
class UserCreator {
  async execute() { }  // Too generic
  async CreateUser() { }  // PascalCase
  async create_user() { }  // snake_case
}
```

### Standard Method Names

| Purpose | Method Name | Usage |
|---------|-------------|-------|
| Main entry point | `run()` | All application and domain services |
| Find by ID | `findById()` | Repository pattern |
| Save entity | `save()` | Repository pattern |
| Delete entity | `delete()` | Repository pattern |
| Create entity | `create()` | Factory methods |
| Update entity | `update()` | Entity methods |
| Validate | `validate[Entity]()` | Validation services |

## Variable and Parameter Naming

### Pattern: `camelCase`

```typescript
✅ Good
const userId = Id.fromString(input.id)
const userEmail = Email.fromString(input.email)
const createdUser = await this.userRepository.save(user)

function createUser(userData: CreateUserInput) {
  const hashedPassword = this.hashPassword(userData.password)
}

❌ Bad
const user_id = Id.fromString(input.id)
const UserEmail = Email.fromString(input.email)
const created_user = await this.userRepository.save(user)
```

## Package Naming

### Pattern: `@dfs/kebab-case`

Package names should be lowercase with hyphens:

```json
✅ Good
"@dfs/users"
"@dfs/common"
"@dfs/database"
"@dfs/email-notifications"

❌ Bad
"@dfs/Users"
"@dfs/emailNotifications"
"@dfs/email_notifications"
```

## Directory Naming

### Pattern: `kebab-case`

Directories should use kebab-case:

```
✅ Good
packages/
├── user-management/
├── email-notifications/
└── payment-processing/

domain/
├── entities/
├── value-objects/
└── domain-services/

❌ Bad
packages/
├── UserManagement/
├── emailNotifications/
└── payment_processing/
```

## Constants and Enums

### Constants: `SCREAMING_SNAKE_CASE`

```typescript
✅ Good
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_PAGE_SIZE = 20
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const

❌ Bad
const maxRetryAttempts = 3
const defaultPageSize = 20
```

### Enums: `PascalCase` with `SCREAMING_SNAKE_CASE` values

```typescript
✅ Good
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

❌ Bad
enum userStatus {
  active = 'active',
  inactive = 'inactive'
}
```

## Type Definitions

### Interfaces: `PascalCase` with `I` prefix (when needed)

```typescript
✅ Good
interface UserRepository {
  findById(id: Id): Promise<User | undefined>
}

interface CreateUserInput {
  name: string
  email: string
}

❌ Bad
interface userRepository { }
interface IUserRepository { }  // Avoid I prefix unless necessary
```

## Import/Export Naming

### Consistent with class names

```typescript
✅ Good
import { UserCreator } from './user-creator.service'
import { UserPrismaRepository } from './user-prisma.repository'

export { UserCreator } from './user-creator.service'

❌ Bad
import { UserCreator as Creator } from './user-creator.service'
import UserCreator from './user-creator.service'  // Avoid default exports
```

## Best Practices

1. **Be Descriptive**: Names should clearly indicate purpose and behavior
2. **Be Consistent**: Follow the same patterns across the codebase
3. **Avoid Abbreviations**: Use full words unless commonly understood (e.g., `id`, `url`)
4. **Use Domain Language**: Reflect business concepts in naming
5. **Avoid Technical Jargon**: Focus on business meaning over technical implementation

## Examples from Current Codebase

### Good Examples (Current Implementation)
```typescript
// Files
user-updater.controller.ts
user-prisma.repository.ts
user.factory.ts

// Classes
class UserUpdaterController { }
class UserPrismaRepository { }
class UserFactory { }

// Methods
async run(input: UserDto) { }
async findByEmail(email: Email) { }
static userPrismaRepository() { }
```

These conventions ensure consistency, readability, and maintainability across the entire monorepo.