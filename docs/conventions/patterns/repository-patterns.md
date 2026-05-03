# Repository Patterns

This document outlines the repository patterns used in the monorepo, following the Port/Adapter pattern from Hexagonal Architecture.

## Repository Architecture

### Port (Domain Interface)
The domain layer defines repository interfaces (ports) that express business needs without infrastructure concerns.

**Location:** `packages/[context]/domain/repositories/`
**Purpose:** Define contracts for data access in business terms
**Dependencies:** Only domain objects (entities, value objects)

### Adapter (Infrastructure Implementation)
The infrastructure layer provides concrete implementations (adapters) that fulfill the domain contracts.

**Location:** `packages/[context]/infrastructure/repositories/`
**Purpose:** Implement data persistence using specific technologies (Prisma, etc.)
**Dependencies:** Database clients, domain entities, external libraries

## Repository Interface Pattern

### Standard Interface Structure

```typescript
// packages/users/domain/repositories/user.repository.ts
import type { Email, Id } from '@dfs/common/domain'
import type { User } from '../entities/user'

export interface UserRepository {
  // Basic CRUD operations
  findById(id: Id): Promise<User | undefined>
  save(user: User): Promise<User>
  delete(user: User): Promise<void>

  // Business-specific queries
  findByEmail(email: Email): Promise<User | undefined>
  findActiveUsers(): Promise<User[]>
  findByRole(role: UserRole): Promise<User[]>

  // Pagination support
  findAll(params: PaginationParams): Promise<PaginatedResult<User>>
}
```

### Key Interface Principles

1. **Business Language**: Method names reflect domain concepts, not database operations
2. **Domain Types**: Parameters and returns use domain entities and value objects
3. **Promise-Based**: All operations are asynchronous
4. **Optional Returns**: Use `undefined` for not-found cases, not `null`

## Repository Implementation Pattern

### Standard Prisma Implementation

```typescript
// packages/users/infrastructure/repositories/user-prisma.repository.ts
import type { Email, Id, PaginationParams, PaginatedResult } from '@dfs/common/domain'
import { BasePrismaRepository } from '@dfs/common/infrastructure'
import type { client as prisma } from '@dfs/database'
import { User } from '../../domain/entities/user'
import type { UserRepository } from '../../domain/repositories/user.repository'

export class UserPrismaRepository extends BasePrismaRepository implements UserRepository {
  protected readonly model = 'user'

  constructor(db: typeof prisma) {
    super(db)
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
      update: this.buildUpdateData(dto)
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
        deletedAt: null,
        emailVerified: { not: null }
      }
    })

    return usersData.map(User.fromDto)
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      this.getModel().findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      this.getModel().count()
    ])

    return {
      items: users.map(User.fromDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  private buildUpdateData(dto: UserDto): Partial<UserDto> {
    // Exclude fields that shouldn't be updated (id, createdAt, etc.)
    const { id, createdAt, ...updateData } = dto
    return {
      ...updateData,
      updatedAt: new Date()
    }
  }
}
```

## Base Repository Class

### Common Infrastructure

```typescript
// packages/common/infrastructure/repositories/base-prisma.repository.ts
import type { client as prisma } from '@dfs/database'

export abstract class BasePrismaRepository {
  protected abstract readonly model: string

  constructor(protected readonly db: typeof prisma) {}

  protected getModel() {
    return this.db[this.model as keyof typeof this.db] as any
  }

  protected async executeInTransaction<T>(
    operations: (tx: typeof prisma) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(operations)
  }
}
```

## Advanced Patterns

### Complex Queries with Specifications

```typescript
// Domain specification pattern
export interface UserSpecification {
  isSatisfiedBy(user: User): boolean
  toQuery(): any // Prisma query object
}

export class ActiveUserSpecification implements UserSpecification {
  isSatisfiedBy(user: User): boolean {
    return user.emailVerified !== null && user.deletedAt === null
  }

  toQuery() {
    return {
      emailVerified: { not: null },
      deletedAt: null
    }
  }
}

// Repository with specification support
export class UserPrismaRepository implements UserRepository {
  async findBySpecification(spec: UserSpecification): Promise<User[]> {
    const usersData = await this.getModel().findMany({
      where: spec.toQuery()
    })

    return usersData.map(User.fromDto)
  }
}
```

### Table Query Builder Integration

```typescript
// Using table query builder for advanced filtering and pagination
export class UserPrismaRepository extends BasePrismaRepository implements UserRepository {
  private readonly tableBuilder: PrismaTableQueryBuilder<User, UserDto>

  constructor(db: typeof prisma) {
    super(db)
    this.tableBuilder = new PrismaTableQueryBuilder(
      {
        entityFromDto: (dto: UserDto) => User.fromDto(dto),
        searchableFields: ['name', 'email'],
        sortableFields: ['name', 'email', 'createdAt'],
        filterableFields: ['role', 'emailVerified']
      },
      db,
      this.model
    )
  }

  async findForTable(params: TableQueryParams): Promise<TableQueryResult<User>> {
    return this.tableBuilder.findForTable(params)
  }
}
```

## Transaction Patterns

### Service-Level Transactions

```typescript
// Application service coordinating multiple repositories
export class UserCreator {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly db: typeof prisma
  ) {}

  async run(input: CreateUserInput): Promise<User> {
    return this.db.$transaction(async (tx) => {
      // Create repositories with transaction client
      const userRepo = new UserPrismaRepository(tx)
      const profileRepo = new ProfilePrismaRepository(tx)

      // Perform operations within transaction
      const user = await userRepo.save(User.create(input))
      const profile = await profileRepo.save(Profile.createFor(user))

      return user
    })
  }
}
```

### Repository-Level Transactions

```typescript
export class UserPrismaRepository implements UserRepository {
  async saveWithProfile(user: User, profile: Profile): Promise<User> {
    return this.executeInTransaction(async (tx) => {
      const userRepo = new UserPrismaRepository(tx)
      const profileRepo = new ProfilePrismaRepository(tx)

      await userRepo.save(user)
      await profileRepo.save(profile)

      return user
    })
  }
}
```

## Entity Transformation Patterns

### DTO to Entity Mapping

```typescript
export class User {
  static fromDto(dto: UserDto): User {
    return new User(
      Id.fromString(dto.id),
      dto.name,
      dto.email ? Email.fromString(dto.email) : null,
      dto.emailVerified,
      dto.image,
      dto.createdAt,
      dto.updatedAt
    )
  }

  toDto(): UserDto {
    return {
      id: this.id.toString(),
      name: this.name,
      email: this.email?.toString() || null,
      emailVerified: this.emailVerified,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
```

### Complex Relationship Mapping

```typescript
export class UserPrismaRepository implements UserRepository {
  async findWithProfile(id: Id): Promise<UserWithProfile | undefined> {
    const userData = await this.getModel().findUnique({
      where: { id: id.toString() },
      include: {
        profile: true,
        roles: true
      }
    })

    if (!userData) return undefined

    return {
      user: User.fromDto(userData),
      profile: userData.profile ? Profile.fromDto(userData.profile) : null,
      roles: userData.roles.map(Role.fromDto)
    }
  }
}
```

## Error Handling

### Repository-Specific Errors

```typescript
export class UserNotFoundError extends Error {
  constructor(id: Id) {
    super(`User with id ${id.toString()} not found`)
    this.name = 'UserNotFoundError'
  }
}

export class UserPrismaRepository implements UserRepository {
  async findById(id: Id): Promise<User | undefined> {
    try {
      const userData = await this.getModel().findUnique({
        where: { id: id.toString() }
      })

      return userData ? User.fromDto(userData) : undefined
    } catch (error) {
      if (error.code === 'P2001') {
        // Prisma record not found
        return undefined
      }
      throw new RepositoryError('Failed to find user', error)
    }
  }
}
```

## Testing Patterns

### Repository Testing

```typescript
// user-prisma.repository.test.ts
import { describe, beforeEach, afterEach, it, expect } from 'bun:test'

describe('UserPrismaRepository', () => {
  let repository: UserPrismaRepository
  let testDb: PrismaClient

  beforeEach(async () => {
    testDb = await createTestDatabase()
    repository = new UserPrismaRepository(testDb)
  })

  afterEach(async () => {
    await cleanupTestDatabase(testDb)
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userData = await seedUser(testDb)
      const id = Id.fromString(userData.id)

      // Act
      const user = await repository.findById(id)

      // Assert
      expect(user).toBeDefined()
      expect(user!.id).toEqual(id)
    })

    it('should return undefined when not found', async () => {
      // Arrange
      const id = Id.generate()

      // Act
      const user = await repository.findById(id)

      // Assert
      expect(user).toBeUndefined()
    })
  })
})
```

### Mock Repository for Service Testing

```typescript
// Create mock repository for service tests
import { mock } from 'bun:test'

const createMockUserRepository = (): MockedUserRepository => ({
  findById: mock(),
  save: mock(),
  delete: mock(),
  findByEmail: mock(),
  findActiveUsers: mock(),
  findAll: mock()
})

type MockedUserRepository = {
  [K in keyof UserRepository]: ReturnType<typeof mock>
}

// Use in service tests
import { describe, beforeEach, it, expect } from 'bun:test'

describe('UserCreator', () => {
  let userCreator: UserCreator
  let mockRepository: MockedUserRepository

  beforeEach(() => {
    mockRepository = createMockUserRepository()
    userCreator = new UserCreator(mockRepository)
  })

  it('should create user successfully', async () => {
    // Arrange
    mockRepository.save.mockResolvedValue(expectedUser)

    // Act & Assert
    const result = await userCreator.run(input)
    expect(mockRepository.save).toHaveBeenCalledWith(expect.any(User))
  })
})
```

## Factory Integration

### Repository Factory Pattern

```typescript
// user.factory.ts
export class UserFactory {
  private static userRepositoryInstance: UserPrismaRepository

  static userRepository(): UserRepository {
    if (!UserFactory.userRepositoryInstance) {
      UserFactory.userRepositoryInstance = new UserPrismaRepository(client)
    }
    return UserFactory.userRepositoryInstance
  }

  // Services using repository
  static userCreator(): UserCreator {
    return new UserCreator(
      UserFactory.userRepository(),
      // ... other dependencies
    )
  }
}
```

## Best Practices

1. **Interface Segregation**: Keep repository interfaces focused and cohesive
2. **Domain Language**: Use business terms in method names, not database operations
3. **Entity Transformation**: Always transform between DTOs and entities at repository boundaries
4. **Error Handling**: Handle database-specific errors and convert to domain errors
5. **Transaction Management**: Use transactions for multi-entity operations
6. **Testing**: Test repositories with real database instances, mock them in service tests
7. **Performance**: Include pagination for list operations and optimize queries
8. **Specification Pattern**: Use specifications for complex query logic

These patterns ensure clean separation between domain logic and data persistence while maintaining consistency across the monorepo.