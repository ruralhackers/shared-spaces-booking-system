import { DomainError } from './domain.error'

export class ValidationError extends DomainError {
  public readonly statusCode = 400

  constructor(message: string, field?: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', field ? { ...metadata, field } : metadata)
  }

  static invalidFormat(field: string, value: unknown) {
    return new ValidationError(`Invalid format for ${field}: ${value}`, field, { value })
  }
}
