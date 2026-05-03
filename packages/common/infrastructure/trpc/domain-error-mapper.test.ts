import { describe, expect, it } from 'bun:test'
import { TRPCError } from '@trpc/server'
import { BusinessRuleError } from '../../domain/errors/business-rule.error'
import { ConflictError } from '../../domain/errors/conflict.error'
import { ForbiddenError } from '../../domain/errors/forbidden.error'
import { NotFoundError } from '../../domain/errors/not-found.error'
import { UnauthorizedError } from '../../domain/errors/unauthorized.error'
import { ValidationError } from '../../domain/errors/validation.error'
import { mapDomainErrorToTRPC } from './domain-error-mapper'

describe('mapDomainErrorToTRPC', () => {
  it('should map ValidationError to BAD_REQUEST', () => {
    const error = new ValidationError('Invalid email', 'email')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('BAD_REQUEST')
    expect(result.message).toBe('Invalid email')
  })

  it('should map UnauthorizedError to UNAUTHORIZED', () => {
    const error = new UnauthorizedError('Token expired')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('UNAUTHORIZED')
    expect(result.message).toBe('Token expired')
  })

  it('should map ForbiddenError to FORBIDDEN', () => {
    const error = ForbiddenError.insufficientPermissions('delete')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('FORBIDDEN')
    expect(result.message).toBe('Insufficient permissions to delete')
  })

  it('should map NotFoundError to NOT_FOUND', () => {
    const error = NotFoundError.withId('User', '123')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('NOT_FOUND')
    expect(result.message).toBe('User with identifier "123" not found')
  })

  it('should map ConflictError to CONFLICT', () => {
    const error = ConflictError.alreadyExists('User', 'john@test.com')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('CONFLICT')
    expect(result.message).toBe('User with identifier "john@test.com" already exists')
  })

  it('should map BusinessRuleError to UNPROCESSABLE_CONTENT', () => {
    const error = new BusinessRuleError('Cannot process', 'CUSTOM_CODE', { detail: 'info' })
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('UNPROCESSABLE_CONTENT')
    expect(result.message).toBe('Cannot process')
  })

  it('should pass through TRPCError unchanged', () => {
    const error = new TRPCError({ code: 'TIMEOUT', message: 'Timed out' })
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBe(error)
  })

  it('should map unknown errors to INTERNAL_SERVER_ERROR', () => {
    const error = new Error('Something broke')
    const result = mapDomainErrorToTRPC(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('INTERNAL_SERVER_ERROR')
    expect(result.message).toBe('Something broke')
  })

  it('should handle unknown error with empty message', () => {
    const error = new Error()
    const result = mapDomainErrorToTRPC(error)

    expect(result.code).toBe('INTERNAL_SERVER_ERROR')
    expect(result.message).toBe('An unexpected error occurred')
  })
})
