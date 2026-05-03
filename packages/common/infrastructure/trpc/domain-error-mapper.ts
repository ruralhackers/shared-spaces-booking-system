import { TRPCError } from '@trpc/server'
import { BusinessRuleError } from '../../domain/errors/business-rule.error'
import { ConflictError } from '../../domain/errors/conflict.error'
import { ForbiddenError } from '../../domain/errors/forbidden.error'
import { NotFoundError } from '../../domain/errors/not-found.error'
import { UnauthorizedError } from '../../domain/errors/unauthorized.error'
import { ValidationError } from '../../domain/errors/validation.error'

export function mapDomainErrorToTRPC(error: Error): TRPCError {
  if (error instanceof TRPCError) {
    return error
  }

  if (error instanceof BusinessRuleError) {
    return new TRPCError({
      code: 'UNPROCESSABLE_CONTENT',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  if (error instanceof ValidationError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  if (error instanceof NotFoundError) {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  if (error instanceof UnauthorizedError) {
    return new TRPCError({
      code: 'UNAUTHORIZED',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  if (error instanceof ForbiddenError) {
    return new TRPCError({
      code: 'FORBIDDEN',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  if (error instanceof ConflictError) {
    return new TRPCError({
      code: 'CONFLICT',
      message: error.message,
      cause: { code: error.code, metadata: error.metadata }
    })
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    cause: error
  })
}
