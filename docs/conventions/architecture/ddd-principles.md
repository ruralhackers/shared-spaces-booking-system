# DDD Principles in Practice

This document explains how Domain-Driven Design principles are applied throughout the monorepo.

## Core DDD Concepts

### Bounded Context
Each package represents a **Bounded Context** - a clear boundary within which a domain model is defined and applicable.

```
packages/
├── users/           # User Management Context
├── orders/          # Order Management Context
├── payments/        # Payment Processing Context
├── inventory/       # Inventory Management Context
└── common/          # Shared Kernel
```

### Ubiquitous Language
The code reflects the business language used by domain experts. Class names, method names, and concepts match business terminology.

```typescript
// ✅ Uses business language
class Order {
  calculateTotalPrice(): Money { }
  markAsShipped(): void { }
  canBeCancelled(): boolean { }
}

// ❌ Technical language
class OrderEntity {
  computeSum(): number { }
  setStatus(status: string): void { }
  isEditable(): boolean { }
}
```

## Domain Layer Patterns

### Entities and Aggregates

**Entities** have identity and lifecycle, representing core business concepts:

```typescript
export class User {
  // Identity
  public readonly id: Id

  // State
  private name: string
  private email: Email
  private emailVerified: Date | null

  // Business methods
  verifyEmail(): void {
    if (!this.email) {
      throw new DomainError('Cannot verify user without email')
    }
    this.emailVerified = new Date()
  }

  // Business rules
  canPlaceOrder(): boolean {
    return this.isEmailVerified() && this.isActive()
  }
}
```

**Aggregates** maintain consistency boundaries:

```typescript
export class Order {
  private items: OrderItem[] = []

  addItem(product: Product, quantity: number): void {
    // Invariant: Cannot exceed max items
    if (this.items.length >= 50) {
      throw new DomainError('Cannot exceed 50 items per order')
    }

    // Invariant: Cannot add negative quantity
    if (quantity <= 0) {
      throw new DomainError('Quantity must be positive')
    }

    const item = OrderItem.create(product, quantity)
    this.items.push(item)
  }

  // Aggregate root controls access to children
  getItems(): readonly OrderItem[] {
    return Object.freeze([...this.items])
  }
}
```

### Value Objects

**Value Objects** represent concepts without identity:

```typescript
export class Email {
  private constructor(private readonly value: string) {
    this.validateFormat(value)
  }

  static fromString(email: string): Email {
    return new Email(email.toLowerCase().trim())
  }

  toString(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  private validateFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new DomainError(`Invalid email format: ${email}`)
    }
  }
}
```

### Domain Services

**Domain Services** contain domain logic that doesn't belong to a specific entity:

```typescript
export class OrderPricingService {
  private readonly logger: Logger

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create(OrderPricingService.name)
  }

  run(order: Order, customer: Customer): OrderTotal {
    this.logger.debug('Calculating order pricing', {
      orderId: order.id.toString(),
      customerId: customer.id.toString()
    })

    const subtotal = this.calculateSubtotal(order)
    const discount = this.calculateDiscount(customer, subtotal)
    const tax = this.calculateTax(subtotal, discount, customer.address)
    const shipping = this.calculateShipping(order, customer.address)

    return new OrderTotal({
      subtotal,
      discount,
      tax,
      shipping,
      total: subtotal.subtract(discount).add(tax).add(shipping)
    })
  }

  private calculateDiscount(customer: Customer, subtotal: Money): Money {
    // Business rule: VIP customers get 10% discount on orders over $100
    if (customer.isVip() && subtotal.isGreaterThan(Money.dollars(100))) {
      return subtotal.multiply(0.10)
    }
    return Money.zero()
  }
}
```

## Application Layer Patterns

### Use Cases (Application Services)

**Application Services** orchestrate domain objects to fulfill business use cases:

```typescript
export class OrderCreator {
  private readonly logger: Logger

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: OrderPricingService,
    loggerFactory: LoggerFactory
  ) {
    this.logger = loggerFactory.create(OrderCreator.name)
  }

  async run(input: CreateOrderInput): Promise<Order> {
    this.logger.info('Creating order', { customerId: input.customerId })

    // 1. Load domain objects
    const customer = await this.loadCustomer(input.customerId)

    // 2. Business validation
    if (!customer.canPlaceOrder()) {
      throw new BusinessError('Customer cannot place orders')
    }

    // 3. Create aggregate
    const order = Order.create({
      customerId: customer.id,
      shippingAddress: customer.defaultAddress
    })

    // 4. Add items with domain validation
    for (const item of input.items) {
      await this.addItemToOrder(order, item)
    }

    // 5. Calculate pricing using domain service
    const pricing = this.pricingService.run(order, customer)
    order.applyPricing(pricing)

    // 6. Save aggregate
    const savedOrder = await this.orderRepository.save(order)

    this.logger.info('Order created successfully', {
      orderId: savedOrder.id.toString(),
      total: savedOrder.total.toString()
    })

    return savedOrder
  }

  private async addItemToOrder(order: Order, itemInput: OrderItemInput): Promise<void> {
    // Check inventory
    const available = await this.inventoryService.checkAvailability(
      itemInput.productId,
      itemInput.quantity
    )

    if (!available) {
      throw new BusinessError(`Product ${itemInput.productId} not available`)
    }

    // Reserve inventory
    await this.inventoryService.reserve(itemInput.productId, itemInput.quantity)

    // Add to order (domain validation happens here)
    order.addItem(itemInput.productId, itemInput.quantity)
  }
}
```

### Domain Events

**Domain Events** represent something important that happened in the domain:

```typescript
// Domain Event
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: Id,
    public readonly customerId: Id,
    public readonly total: Money,
    public readonly occurredAt: Date = new Date()
  ) {}
}

// Raise events from aggregates
export class Order {
  private events: DomainEvent[] = []

  static create(data: CreateOrderData): Order {
    const order = new Order(/* ... */)

    // Raise domain event
    order.addEvent(new OrderCreatedEvent(
      order.id,
      order.customerId,
      order.total
    ))

    return order
  }

  private addEvent(event: DomainEvent): void {
    this.events.push(event)
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.events]
  }

  markEventsAsCommitted(): void {
    this.events = []
  }
}

// Handle events in application services
export class OrderEventHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Send confirmation email
    await this.emailService.sendOrderConfirmation(event.orderId)

    // Track analytics
    await this.analyticsService.trackOrderCreated({
      orderId: event.orderId.toString(),
      customerId: event.customerId.toString(),
      amount: event.total.amount
    })
  }
}
```

## Repository Pattern (Ports & Adapters)

### Domain Repository Interface (Port)

```typescript
// Domain defines what it needs
export interface OrderRepository {
  findById(id: Id): Promise<Order | undefined>
  save(order: Order): Promise<Order>
  findByCustomer(customerId: Id): Promise<Order[]>
  findPendingOrders(): Promise<Order[]>
}
```

### Infrastructure Implementation (Adapter)

```typescript
// Infrastructure provides implementation
export class OrderPrismaRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async save(order: Order): Promise<Order> {
    // Handle domain events
    const events = order.getUncommittedEvents()

    const result = await this.db.$transaction(async (tx) => {
      // Save aggregate
      const savedOrder = await this.saveOrderData(tx, order)

      // Publish domain events
      await this.publishEvents(events)

      return savedOrder
    })

    order.markEventsAsCommitted()
    return result
  }

  private async publishEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.eventBus.publish(event)
    }
  }
}
```

## Anti-Corruption Layer

When integrating with external systems, use anti-corruption layers:

```typescript
// External system model
interface ExternalUserResponse {
  user_id: string
  full_name: string
  email_address: string
  is_verified: boolean
}

// Anti-corruption layer
export class ExternalUserAdapter {
  toDomainUser(external: ExternalUserResponse): User {
    return User.create({
      id: Id.fromString(external.user_id),
      name: external.full_name,
      email: Email.fromString(external.email_address),
      emailVerified: external.is_verified ? new Date() : null
    })
  }

  fromDomainUser(user: User): ExternalUserRequest {
    return {
      user_id: user.id.toString(),
      full_name: user.name,
      email_address: user.email?.toString() || '',
      is_verified: user.isEmailVerified()
    }
  }
}
```

## Strategic Design

### Context Map

```typescript
// Shared Kernel - shared between contexts
export interface Money {
  amount: number
  currency: string
}

// Customer-Supplier relationship
// Orders context depends on Users context
import { UserId } from '@dfs/users'

export class Order {
  constructor(
    public readonly customerId: UserId, // Reference to other context
    // ... other properties
  ) {}
}

// Conformist relationship
// Payments context conforms to external payment provider
export class PaymentGatewayAdapter {
  async processPayment(payment: Payment): Promise<PaymentResult> {
    // Conform to external API structure
    const externalRequest = this.toExternalFormat(payment)
    const response = await this.externalGateway.charge(externalRequest)
    return this.toDomainResult(response)
  }
}
```

### Published Language

```typescript
// Common/shared types used across contexts
export interface PaymentCompletedEvent {
  paymentId: string
  orderId: string
  amount: number
  currency: string
  completedAt: Date
}

// Contexts can depend on published events
export class OrderEventHandler {
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const order = await this.orderRepository.findById(Id.fromString(event.orderId))
    order?.markAsPaid()
    await this.orderRepository.save(order!)
  }
}
```

## Best Practices

### 1. Rich Domain Models
- Put business logic in entities and domain services
- Avoid anemic domain models (just getters/setters)
- Use intention-revealing method names

### 2. Consistency Boundaries
- Keep aggregates small and focused
- Only reference other aggregates by ID
- Maintain invariants within aggregate boundaries

### 3. Domain Events
- Use events for eventual consistency between aggregates
- Events should describe what happened in business terms
- Handle cross-aggregate business rules via events

### 4. Layered Architecture
- Domain layer has no dependencies on other layers
- Application layer orchestrates domain objects
- Infrastructure implements domain contracts

### 5. Ubiquitous Language
- Code should read like business documentation
- Collaborate with domain experts on naming
- Refactor when language evolves

These patterns ensure the codebase remains aligned with business needs and maintains long-term maintainability.