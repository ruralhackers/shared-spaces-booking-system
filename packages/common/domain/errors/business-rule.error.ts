import { DomainError } from './domain.error'

export class BusinessRuleError extends DomainError {
  public readonly statusCode = 422

  constructor(message: string, code?: string, metadata?: Record<string, unknown>) {
    super(message, code || 'BUSINESS_RULE_VIOLATION', metadata)
  }
}
