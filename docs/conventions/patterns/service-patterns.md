# Service Patterns

This document outlines the service patterns used in the monorepo, following Domain-Driven Design principles and inspired by PromptHero's best practices.

## Service Types

### Domain Services
Domain services represent domain concepts and operations that don't naturally belong to a specific entity.

**Location:** `packages/[context]/domain/services/`
**Purpose:** Pure business logic and domain rules
**Dependencies:** Only other domain objects (entities, value objects, other domain services)

### Application Services
Application services represent complete use cases and orchestrate domain objects.

**Location:** `packages/[context]/application/[entity]/`
**Purpose:** Use case orchestration, transaction management, external integrations
**Dependencies:** Domain services, repositories, external adapters

## Standard Service Structure

### Template Pattern

```typescript
// user-creator.service.ts
import { Logger, LoggerFactory } from '@dfs/common/infrastructure'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { CreateUserInput } from './create-user.input'

export class UserCreator {
  private readonly logger: Logger

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.create(UserCreator.name)
  }

  async run(input: CreateUserInput): Promise<User> {
    this.logger.info('Creating new user', { email: input.email })

    // 1. Validate input
    this.validateInput(input)

    // 2. Business logic
    const user = await this.executeCreation(input)

    // 3. Side effects
    await this.handleSideEffects(user)

    this.logger.info('User created successfully', { userId: user.id.toString() })
    return user
  }

  private validateInput(input: CreateUserInput): void {
    // Input validation logic
  }

  private async executeCreation(input: CreateUserInput): Promise<User> {
    // Core business logic
  }

  private async handleSideEffects(user: User): Promise<void> {
    // Side effects like sending emails, events, etc.
  }
}
```

## Key Patterns

### 1. Single Entry Point: `run()` Method

Every service must have a public `run()` method as the main entry point:

```typescript
✅ Good
class UserCreator {
  async run(input: CreateUserInput): Promise<User> {
    // Main use case logic
  }
}

class UserFinder {
  async run(query: UserSearchQuery): Promise<User[]> {
    // Search logic
  }
}

❌ Bad
class UserCreator {
  async create(input: CreateUserInput): Promise<User> { }
  async execute(input: CreateUserInput): Promise<User> { }
  async handle(input: CreateUserInput): Promise<User> { }
}
```

### 2. Constructor-Based Dependency Injection

Dependencies are injected through the constructor and stored as private readonly fields:

```typescript
✅ Good
export class UserCreator {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly loggerFactory: LoggerFactory
  ) {}
}

❌ Bad
export class UserCreator {
  private userRepository: UserRepository

  setUserRepository(repo: UserRepository) {
    this.userRepository = repo
  }
}
```

### 3. Structured Execution Flow

Services should follow a consistent internal structure:

```typescript
async run(input: InputType): Promise<OutputType> {
  // 1. Logging entry
  this.logger.info('Starting operation', { context })

  // 2. Input validation
  this.validateInput(input)

  // 3. Core business logic
  const result = await this.executeCore(input)

  // 4. Side effects (optional)
  await this.handleSideEffects(result)

  // 5. Logging completion
  this.logger.info('Operation completed', { result })

  return result
}
```

### 4. Private Method Organization

Break down complex logic into well-named private methods:

```typescript
class UserCreator {
  async run(input: CreateUserInput): Promise<User> {
    this.validateInput(input)
    const user = await this.createUser(input)
    await this.sendWelcomeEmail(user)
    return user
  }

  private validateInput(input: CreateUserInput): void {
    if (!input.email) throw new Error('EMAIL_REQUIRED')
    if (!input.name) throw new Error('NAME_REQUIRED')
  }

  private async createUser(input: CreateUserInput): Promise<User> {
    const hashedPassword = await this.hashPassword(input.password)
    const user = User.create({
      ...input,
      password: hashedPassword
    })
    return this.userRepository.save(user)
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.sendWelcomeEmail({
      to: user.email.toString(),
      name: user.name
    })
  }

  private async hashPassword(password: string): Promise<string> {
    return this.cryptoService.hash(password)
  }
}
```

## Service Examples

### Domain Service Example

```typescript
// packages/users/domain/services/user-validator.service.ts
export class UserValidator {
  private readonly logger: Logger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(UserValidator.name)
  }

  run(user: User): ValidationResult {
    this.logger.debug('Validating user', { userId: user.id.toString() })

    const errors: string[] = []

    if (!this.isEmailValid(user.email)) {
      errors.push('INVALID_EMAIL')
    }

    if (!this.isNameValid(user.name)) {
      errors.push('INVALID_NAME')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private isEmailValid(email: Email | null): boolean {
    return email !== null && email.toString().includes('@')
  }

  private isNameValid(name: string | null): boolean {
    return name !== null && name.trim().length >= 2
  }
}
```

### Application Service Example

```typescript
// packages/users/application/user/user-creator.service.ts
export class UserCreator {
  private readonly logger: Logger

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userValidator: UserValidator,
    private readonly emailService: EmailService,
    loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.create(UserCreator.name)
  }

  async run(input: CreateUserInput): Promise<User> {
    this.logger.info('Creating user', { email: input.email })

    // Validate input
    await this.validateUniqueEmail(input.email)

    // Create user entity
    const user = User.create({
      id: Id.generate(),
      name: input.name,
      email: Email.fromString(input.email),
      emailVerified: null,
      image: input.image || null
    })

    // Domain validation
    const validation = this.userValidator.run(user)
    if (!validation.isValid) {
      throw new Error(`VALIDATION_FAILED: ${validation.errors.join(', ')}`)
    }

    // Save user
    await this.userRepository.save(user)

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      to: user.email.toString(),
      name: user.name
    })

    this.logger.info('User created successfully', {
      userId: user.id.toString()
    })

    return user
  }

  private async validateUniqueEmail(email: string): Promise<void> {
    const emailVO = Email.fromString(email)
    const existingUser = await this.userRepository.findByEmail(emailVO)

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }
  }
}
```

## Error Handling Patterns

Services use typed domain errors from `@dfs/common/domain`. These are automatically translated to TRPC errors by middleware. See [error-handling.md](./error-handling.md) for the full reference.

### Domain Errors in Services

```typescript
import { ConflictError, NotFoundError, ValidationError } from '@dfs/common/domain'

class UserCreator {
  async run(input: CreateUserInput): Promise<User> {
    if (!input.email) throw new ValidationError('Email is required', 'email')

    if (await this.emailAlreadyExists(input.email)) {
      throw ConflictError.alreadyExists('User', input.email)
    }

    const user = await this.userRepository.findById(input.id)
    if (!user) throw NotFoundError.withId('User', input.id)

    return user
  }
}
```

### Domain-Specific Errors

Bounded contexts can extend base domain errors for specific scenarios:

```typescript
import { ForbiddenError } from '@dfs/common/domain'

export class DisposableEmailError extends ForbiddenError {
  constructor(email: string, domain: string) {
    super('Registration not allowed from disposable email domains', {
      email,
      domain
    })
  }
}
```

### Infrastructure Errors

Let infrastructure failures bubble up — the TRPC middleware maps unknown errors to `INTERNAL_SERVER_ERROR`. Only catch infrastructure errors when you need to log or recover:

```typescript
class UserCreator {
  async run(input: CreateUserInput): Promise<User> {
    try {
      await this.emailService.sendWelcomeEmail(user)
    } catch (error) {
      this.logger.error('Failed to send welcome email', { error })
      // Don't throw — user creation should succeed even if email fails
    }
  }
}
```

## Testing Patterns

### Service Testing Structure

```typescript
// user-creator.service.test.ts
import { describe, beforeEach, it, expect } from 'bun:test'
import { mock, type MockedFunction } from 'bun:test'

describe('UserCreator', () => {
  let userCreator: UserCreator
  let mockUserRepository: MockedUserRepository
  let mockEmailService: MockedEmailService
  let mockLoggerFactory: MockedLoggerFactory

  beforeEach(() => {
    mockUserRepository = createMockRepository()
    mockEmailService = createMockEmailService()
    mockLoggerFactory = createMockLoggerFactory()

    userCreator = new UserCreator(
      mockUserRepository,
      mockEmailService,
      mockLoggerFactory
    )
  })

  describe('run', () => {
    it('should create user successfully', async () => {
      // Arrange
      const input = createValidInput()
      mockUserRepository.findByEmail.mockResolvedValue(undefined)
      mockUserRepository.save.mockResolvedValue(expectedUser)

      // Act
      const result = await userCreator.run(input)

      // Assert
      expect(result).toEqual(expectedUser)
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled()
    })

    it('should throw error when email already exists', async () => {
      // Arrange
      const input = createValidInput()
      mockUserRepository.findByEmail.mockResolvedValue(existingUser)

      // Act & Assert
      await expect(userCreator.run(input)).rejects.toThrow(UserAlreadyExistsError)
    })
  })
})
```

## Factory Integration

Services are instantiated through factory classes:

```typescript
// user.factory.ts
export class UserFactory {
  // Services
  static userCreator(): UserCreator {
    return new UserCreator(
      UserFactory.userRepository(),
      UserFactory.userValidator(),
      UserFactory.emailService(),
      LoggerFactory.shared()
    )
  }

  static userValidator(): UserValidator {
    return new UserValidator(LoggerFactory.shared())
  }

  // Repositories and external services...
}
```

## Best Practices

1. **Single Responsibility**: Each service should have one clear purpose
2. **Consistent Interface**: Always use `run()` as the main entry point
3. **Dependency Injection**: Use constructor injection for all dependencies
4. **Logging**: Include comprehensive logging for debugging and monitoring
5. **Error Handling**: Use domain-specific errors with clear messages
6. **Testability**: Design services to be easily testable with mocked dependencies
7. **Immutability**: Prefer immutable operations and pure functions
8. **Validation**: Validate inputs early and throw descriptive errors

These patterns ensure consistency, maintainability, and testability across all services in the monorepo.