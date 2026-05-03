# User Management - Complete Example

This example demonstrates a complete bounded context implementation following all the patterns and conventions established in the monorepo.

## Overview

The User Management bounded context handles:
- User registration and profile management
- Email verification and authentication
- User role and permission management
- User search and filtering

## Package Structure

```
packages/users/
├── domain/
│   ├── entities/
│   │   ├── user.ts                    # User aggregate root
│   │   ├── user.dto.ts               # Data transfer object
│   │   └── user-role.ts              # User role value object
│   ├── repositories/
│   │   └── user.repository.ts        # Repository interface (port)
│   ├── services/
│   │   ├── user-validator.service.ts # Domain service
│   │   └── email-verifier.service.ts # Domain service
│   └── events/
│       ├── user-created.event.ts     # Domain event
│       └── user-email-verified.event.ts
├── application/
│   └── user/
│       ├── user-creator.service.ts   # Use case service
│       ├── user-finder.service.ts    # Use case service
│       └── user-updater.service.ts   # Use case service
├── infrastructure/
│   ├── repositories/
│   │   ├── user-prisma.repository.ts # Repository implementation (adapter)
│   │   └── user-table-config.ts      # Table configuration
│   ├── controllers/
│   │   ├── user-creator.controller.ts # Web controller
│   │   └── user-updater.controller.ts # Web controller
│   └── factories/
│       └── user.factory.ts           # Dependency injection factory
└── index.ts                          # Public API exports
```

## Domain Layer

### Entity: User

```typescript
// packages/users/domain/entities/user.ts
import { BusinessRuleError, Email, Id } from '@dfs/common/domain'
import type { UserDto } from './user.dto'
import { UserRole } from './user-role'

export class User {
  private constructor(
    public readonly id: Id,
    public name: string | null,
    public email: Email | null,
    public emailVerified: Date | null,
    public image: string | null,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromDto(dto: UserDto): User {
    return new User(
      Id.fromString(dto.id),
      dto.name,
      dto.email ? Email.fromString(dto.email) : null,
      dto.emailVerified,
      dto.image,
      UserRole.fromString(dto.role),
      dto.createdAt,
      dto.updatedAt
    )
  }

  static create(data: {
    name: string
    email: string
    image?: string
    role?: UserRole
  }): User {
    return new User(
      Id.generate(),
      data.name,
      Email.fromString(data.email),
      null, // Not verified yet
      data.image || null,
      data.role || UserRole.USER,
      new Date(),
      new Date()
    )
  }

  update(data: Partial<{
    name: string
    email: string
    image: string
  }>): void {
    if (data.name !== undefined) {
      this.name = data.name
    }
    if (data.email !== undefined) {
      this.email = Email.fromString(data.email)
      this.emailVerified = null // Reset verification on email change
    }
    if (data.image !== undefined) {
      this.image = data.image
    }
    this.updatedAt = new Date()
  }

  verifyEmail(): void {
    if (!this.email) {
      throw new BusinessRuleError('Cannot verify empty email', 'CANNOT_VERIFY_EMPTY_EMAIL')
    }
    this.emailVerified = new Date()
    this.updatedAt = new Date()
  }

  isEmailVerified(): boolean {
    return this.emailVerified !== null
  }

  isActive(): boolean {
    return this.isEmailVerified()
  }

  canPerformAdminActions(): boolean {
    return this.role.equals(UserRole.ADMIN) && this.isActive()
  }

  toDto(): UserDto {
    return {
      id: this.id.toString(),
      name: this.name,
      email: this.email?.toString() || null,
      emailVerified: this.emailVerified,
      image: this.image,
      role: this.role.toString(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
```

### Value Object: UserRole

```typescript
// packages/users/domain/entities/user-role.ts
import { ValidationError } from '@dfs/common/domain'

export class UserRole {
  static readonly ADMIN = new UserRole('ADMIN')
  static readonly USER = new UserRole('USER')
  static readonly GUEST = new UserRole('GUEST')

  private constructor(private readonly value: string) {}

  static fromString(value: string): UserRole {
    switch (value) {
      case 'ADMIN':
        return UserRole.ADMIN
      case 'USER':
        return UserRole.USER
      case 'GUEST':
        return UserRole.GUEST
      default:
        throw ValidationError.invalidFormat('role', value)
    }
  }

  toString(): string {
    return this.value
  }

  equals(other: UserRole): boolean {
    return this.value === other.value
  }

  hasPermission(action: string): boolean {
    switch (this.value) {
      case 'ADMIN':
        return true // Admin can do everything
      case 'USER':
        return !['DELETE_USERS', 'MANAGE_ROLES'].includes(action)
      case 'GUEST':
        return ['READ_PROFILE'].includes(action)
      default:
        return false
    }
  }
}
```

### Repository Interface

```typescript
// packages/users/domain/repositories/user.repository.ts
import type { Email, Id, TableQueryParams, TableQueryResult } from '@dfs/common/domain'
import type { User } from '../entities/user'

export interface UserRepository {
  findById(id: Id): Promise<User | undefined>
  save(user: User): Promise<User>
  delete(user: User): Promise<void>

  findByEmail(email: Email): Promise<User | undefined>
  findActiveUsers(): Promise<User[]>
  findForTable(params: TableQueryParams): Promise<TableQueryResult<User>>
}
```

### Domain Service: User Validator

```typescript
// packages/users/domain/services/user-validator.service.ts
import { Logger, LoggerFactory } from '@dfs/common/infrastructure'
import type { User } from '../entities/user'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class UserValidator {
  private readonly logger: Logger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(UserValidator.name)
  }

  run(user: User): ValidationResult {
    this.logger.debug('Validating user', { userId: user.id.toString() })

    const errors: string[] = []

    if (!this.isNameValid(user.name)) {
      errors.push('INVALID_NAME')
    }

    if (!this.isEmailValid(user.email)) {
      errors.push('INVALID_EMAIL')
    }

    const result = {
      isValid: errors.length === 0,
      errors
    }

    this.logger.debug('Validation result', { result, userId: user.id.toString() })
    return result
  }

  private isNameValid(name: string | null): boolean {
    return name !== null && name.trim().length >= 2 && name.trim().length <= 100
  }

  private isEmailValid(email: Email | null): boolean {
    return email !== null
  }
}
```

## Application Layer

### Use Case: User Creator

```typescript
// packages/users/application/user/user-creator.service.ts
import { ConflictError, Email, ValidationError } from '@dfs/common/domain'
import { Logger, LoggerFactory } from '@dfs/common/infrastructure'
import { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { UserValidator } from '../../domain/services/user-validator.service'
import type { EmailService } from '../../../common/domain/services/email.service'

export interface CreateUserInput {
  name: string
  email: string
  image?: string
}

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
    this.logger.info('Creating new user', { email: input.email })

    // 1. Validate input
    await this.validateInput(input)

    // 2. Create user entity
    const user = User.create({
      name: input.name,
      email: input.email,
      image: input.image
    })

    // 3. Domain validation
    const validation = this.userValidator.run(user)
    if (!validation.isValid) {
      throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // 4. Save user
    const savedUser = await this.userRepository.save(user)

    // 5. Send welcome email
    await this.sendWelcomeEmail(savedUser)

    this.logger.info('User created successfully', {
      userId: savedUser.id.toString()
    })

    return savedUser
  }

  private async validateInput(input: CreateUserInput): Promise<void> {
    if (!input.name?.trim()) {
      throw new ValidationError('Name is required', 'name')
    }

    if (!input.email?.trim()) {
      throw new ValidationError('Email is required', 'email')
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(
      Email.fromString(input.email)
    )

    if (existingUser) {
      throw ConflictError.alreadyExists('User', input.email)
    }
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    if (!user.email) return

    try {
      await this.emailService.sendWelcomeEmail({
        to: user.email.toString(),
        name: user.name || 'User'
      })
    } catch (error) {
      this.logger.error('Failed to send welcome email', {
        error,
        userId: user.id.toString()
      })
      // Don't throw - user creation should succeed even if email fails
    }
  }
}
```

### Use Case: User Finder

```typescript
// packages/users/application/user/user-finder.service.ts
import { NotFoundError } from '@dfs/common/domain'
import type { Email, Id, TableQueryParams, TableQueryResult } from '@dfs/common/domain'
import { Logger, LoggerFactory } from '@dfs/common/infrastructure'
import type { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user.repository'

export class UserFinder {
  private readonly logger: Logger

  constructor(
    private readonly userRepository: UserRepository,
    loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.create(UserFinder.name)
  }

  async run(id: Id): Promise<User> {
    this.logger.info('Finding user by id', { userId: id.toString() })

    const user = await this.userRepository.findById(id)

    if (!user) {
      throw NotFoundError.withId('User', id.toString())
    }

    return user
  }

  async findByEmail(email: Email): Promise<User> {
    this.logger.info('Finding user by email', { email: email.toString() })

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw NotFoundError.withId('User', id.toString())
    }

    return user
  }

  async findActiveUsers(): Promise<User[]> {
    this.logger.info('Finding active users')

    return this.userRepository.findActiveUsers()
  }

  async findForTable(params: TableQueryParams): Promise<TableQueryResult<User>> {
    this.logger.info('Finding users for table', { params })

    return this.userRepository.findForTable(params)
  }
}
```

## Infrastructure Layer

### Repository Implementation

```typescript
// packages/users/infrastructure/repositories/user-prisma.repository.ts
import type { Email, Id, TableQueryParams, TableQueryResult } from '@dfs/common/domain'
import { BasePrismaRepository, PrismaTableQueryBuilder } from '@dfs/common/infrastructure'
import type { client as prisma } from '@dfs/database'
import { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user.repository'
import { userTableConfig } from './user-table-config'

export class UserPrismaRepository extends BasePrismaRepository implements UserRepository {
  protected readonly model = 'user'
  private readonly tableBuilder: PrismaTableQueryBuilder<User, any>

  constructor(db: typeof prisma) {
    super(db)
    this.tableBuilder = new PrismaTableQueryBuilder(
      {
        ...userTableConfig,
        entityFromDto: (dto: any) => User.fromDto(dto)
      },
      db,
      this.model
    )
  }

  async findById(id: Id): Promise<User | undefined> {
    const userData = await this.getModel().findUnique({
      where: { id: id.toString() }
    })

    return userData ? User.fromDto(userData) : undefined
  }

  async save(user: User): Promise<User> {
    const dto = user.toDto()

    const savedData = await this.getModel().upsert({
      where: { id: dto.id },
      create: dto,
      update: {
        name: dto.name,
        email: dto.email,
        emailVerified: dto.emailVerified,
        image: dto.image,
        role: dto.role,
        updatedAt: dto.updatedAt
      }
    })

    return User.fromDto(savedData)
  }

  async delete(user: User): Promise<void> {
    await this.getModel().delete({
      where: { id: user.id.toString() }
    })
  }

  async findByEmail(email: Email): Promise<User | undefined> {
    const userData = await this.getModel().findUnique({
      where: { email: email.toString() }
    })

    return userData ? User.fromDto(userData) : undefined
  }

  async findActiveUsers(): Promise<User[]> {
    const usersData = await this.getModel().findMany({
      where: {
        emailVerified: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    })

    return usersData.map(User.fromDto)
  }

  async findForTable(params: TableQueryParams): Promise<TableQueryResult<User>> {
    return this.tableBuilder.findForTable(params)
  }
}
```

### Controller

```typescript
// packages/users/infrastructure/controllers/user-creator.controller.ts
import { Logger, LoggerFactory } from '@dfs/common/infrastructure'
import { userCreateSchema, type UserCreateInput } from './schemas/user-create.schema'
import type { UserCreator } from '../../application/user/user-creator.service'

export class UserCreatorController {
  private readonly logger: Logger

  constructor(
    private readonly userCreator: UserCreator,
    loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.create(UserCreatorController.name)
  }

  async run(input: unknown): Promise<any> {
    this.logger.info('Handling user creation request')

    try {
      // 1. Validate and parse input
      const validatedInput = userCreateSchema.parse(input)

      // 2. Execute use case
      const user = await this.userCreator.run({
        name: validatedInput.name,
        email: validatedInput.email,
        image: validatedInput.image
      })

      // 3. Return response
      return {
        success: true,
        data: {
          id: user.id.toString(),
          name: user.name,
          email: user.email?.toString(),
          image: user.image,
          role: user.role.toString(),
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        }
      }
    } catch (error) {
      this.logger.error('User creation failed', { error })

      return {
        success: false,
        error: error.message
      }
    }
  }
}
```

### Factory

```typescript
// packages/users/infrastructure/factories/user.factory.ts
import { LoggerFactory } from '@dfs/common/infrastructure'
import { client as prisma } from '@dfs/database'
import { UserCreator } from '../../application/user/user-creator.service'
import { UserFinder } from '../../application/user/user-finder.service'
import { UserValidator } from '../../domain/services/user-validator.service'
import { UserCreatorController } from '../controllers/user-creator.controller'
import { UserPrismaRepository } from '../repositories/user-prisma.repository'

export class UserFactory {
  private static userPrismaRepositoryInstance: UserPrismaRepository
  private static userValidatorInstance: UserValidator

  // CONTROLLERS
  static userCreatorController(): UserCreatorController {
    return new UserCreatorController(
      UserFactory.userCreator(),
      LoggerFactory.shared()
    )
  }

  // USE CASES
  static userCreator(): UserCreator {
    return new UserCreator(
      UserFactory.userRepository(),
      UserFactory.userValidator(),
      UserFactory.emailService(),
      LoggerFactory.shared()
    )
  }

  static userFinder(): UserFinder {
    return new UserFinder(
      UserFactory.userRepository(),
      LoggerFactory.shared()
    )
  }

  // DOMAIN SERVICES
  static userValidator(): UserValidator {
    if (!UserFactory.userValidatorInstance) {
      UserFactory.userValidatorInstance = new UserValidator(LoggerFactory.shared())
    }
    return UserFactory.userValidatorInstance
  }

  // REPOSITORIES
  static userRepository(): UserPrismaRepository {
    if (!UserFactory.userPrismaRepositoryInstance) {
      UserFactory.userPrismaRepositoryInstance = new UserPrismaRepository(prisma)
    }
    return UserFactory.userPrismaRepositoryInstance
  }

  // EXTERNAL SERVICES
  static emailService() {
    return EmailServiceFactory.create()
  }
}
```

## Public API

```typescript
// packages/users/index.ts
// Domain exports
export { User } from './domain/entities/user'
export { UserRole } from './domain/entities/user-role'
export type { UserRepository } from './domain/repositories/user.repository'

// Application exports
export { UserCreator } from './application/user/user-creator.service'
export { UserFinder } from './application/user/user-finder.service'
export type { CreateUserInput } from './application/user/user-creator.service'

// Infrastructure exports
export { UserFactory } from './infrastructure/factories/user.factory'
export { UserPrismaRepository } from './infrastructure/repositories/user-prisma.repository'
export { UserCreatorController } from './infrastructure/controllers/user-creator.controller'
```

## Usage Examples

### Creating a User

```typescript
import { UserFactory } from '@dfs/users'

// Through controller (web endpoint)
const controller = UserFactory.userCreatorController()
const result = await controller.run({
  name: 'John Doe',
  email: 'john@example.com'
})

// Direct use case usage
const userCreator = UserFactory.userCreator()
const user = await userCreator.run({
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Finding Users

```typescript
import { UserFactory, Id, Email } from '@dfs/users'

const userFinder = UserFactory.userFinder()

// Find by ID
const user = await userFinder.run(Id.fromString('123'))

// Find by email
const user = await userFinder.findByEmail(Email.fromString('john@example.com'))

// Find active users
const activeUsers = await userFinder.findActiveUsers()

// Find for table with pagination
const result = await userFinder.findForTable({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: 'john'
})
```

This example demonstrates how all the patterns work together to create a cohesive, maintainable bounded context following Domain-Driven Design principles.