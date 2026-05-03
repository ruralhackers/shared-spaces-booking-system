import { DomainError } from './domain.error'

export class NotFoundError extends DomainError {
  public readonly statusCode = 404

  constructor(resource: string, identifier?: string, metadata?: Record<string, unknown>) {
    const message = identifier
      ? `${resource} with identifier "${identifier}" not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', metadata)
  }

  static withId(resource: string, id: string) {
    return new NotFoundError(resource, id, { id })
  }
}
