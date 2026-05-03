import { DomainError } from './domain.error'

export class UnauthorizedError extends DomainError {
  public readonly statusCode = 401

  constructor(message: string = 'Unauthorized', metadata?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', metadata)
  }
}
