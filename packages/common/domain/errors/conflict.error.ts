import { DomainError } from './domain.error'

export class ConflictError extends DomainError {
  public readonly statusCode = 409

  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', metadata)
  }

  static alreadyExists(resource: string, identifier: string) {
    return new ConflictError(`${resource} with identifier "${identifier}" already exists`, {
      resource,
      identifier
    })
  }
}
