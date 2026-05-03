import { DomainError } from './domain.error'

export class ForbiddenError extends DomainError {
  public readonly statusCode = 403

  constructor(message: string = 'Forbidden', metadata?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', metadata)
  }

  static insufficientPermissions(action: string) {
    return new ForbiddenError(`Insufficient permissions to ${action}`, { action })
  }
}
