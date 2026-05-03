export abstract class DomainError extends Error {
  public readonly code: string
  public readonly metadata?: Record<string, unknown>
  public abstract readonly statusCode: number

  constructor(message: string, code?: string, metadata?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.code = code || this.name
    this.metadata = metadata

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
