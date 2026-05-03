import { describe, expect, it } from 'bun:test'
import { BusinessRuleError } from './business-rule.error'
import { ConflictError } from './conflict.error'
import { DomainError } from './domain.error'
import { ForbiddenError } from './forbidden.error'
import { NotFoundError } from './not-found.error'
import { UnauthorizedError } from './unauthorized.error'
import { ValidationError } from './validation.error'

describe('DomainError hierarchy', () => {
  describe('ValidationError', () => {
    it('should have statusCode 400 and code VALIDATION_ERROR', () => {
      const error = new ValidationError('Invalid input')

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Invalid input')
      expect(error).toBeInstanceOf(DomainError)
      expect(error).toBeInstanceOf(Error)
    })

    it('should include field in metadata when provided', () => {
      const error = new ValidationError('Bad email', 'email')

      expect(error.metadata).toEqual({ field: 'email' })
    })

    it('should merge field with existing metadata', () => {
      const error = new ValidationError('Bad email', 'email', { extra: 'data' })

      expect(error.metadata).toEqual({ field: 'email', extra: 'data' })
    })

    it('should create invalidFormat error via static method', () => {
      const error = ValidationError.invalidFormat('email', 'not-an-email')

      expect(error.message).toBe('Invalid format for email: not-an-email')
      expect(error.metadata).toEqual({ field: 'email', value: 'not-an-email' })
    })
  })

  describe('UnauthorizedError', () => {
    it('should have statusCode 401 and code UNAUTHORIZED', () => {
      const error = new UnauthorizedError()

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Unauthorized')
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Token expired')

      expect(error.message).toBe('Token expired')
    })
  })

  describe('ForbiddenError', () => {
    it('should have statusCode 403 and code FORBIDDEN', () => {
      const error = new ForbiddenError()

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('Forbidden')
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should create insufficientPermissions error via static method', () => {
      const error = ForbiddenError.insufficientPermissions('delete users')

      expect(error.message).toBe('Insufficient permissions to delete users')
      expect(error.metadata).toEqual({ action: 'delete users' })
    })
  })

  describe('NotFoundError', () => {
    it('should have statusCode 404 and code NOT_FOUND', () => {
      const error = new NotFoundError('User')

      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('User not found')
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should include identifier in message when provided', () => {
      const error = new NotFoundError('User', '123')

      expect(error.message).toBe('User with identifier "123" not found')
    })

    it('should create withId error via static method', () => {
      const error = NotFoundError.withId('Order', 'abc-123')

      expect(error.message).toBe('Order with identifier "abc-123" not found')
      expect(error.metadata).toEqual({ id: 'abc-123' })
    })
  })

  describe('ConflictError', () => {
    it('should have statusCode 409 and code CONFLICT', () => {
      const error = new ConflictError('Resource conflict')

      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('Resource conflict')
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should create alreadyExists error via static method', () => {
      const error = ConflictError.alreadyExists('User', 'john@example.com')

      expect(error.message).toBe('User with identifier "john@example.com" already exists')
      expect(error.metadata).toEqual({ resource: 'User', identifier: 'john@example.com' })
    })
  })

  describe('BusinessRuleError', () => {
    it('should have statusCode 422 and default code BUSINESS_RULE_VIOLATION', () => {
      const error = new BusinessRuleError('Cannot process order')

      expect(error.statusCode).toBe(422)
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(error.message).toBe('Cannot process order')
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should accept custom code', () => {
      const error = new BusinessRuleError('Limit exceeded', 'RATE_LIMIT_EXCEEDED')

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should accept metadata', () => {
      const error = new BusinessRuleError('Limit exceeded', 'RATE_LIMIT', { limit: 100 })

      expect(error.metadata).toEqual({ limit: 100 })
    })
  })
})
