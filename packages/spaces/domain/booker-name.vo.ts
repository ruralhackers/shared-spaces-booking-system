import { ValidationError } from '@dfs/common'

export class BookerName {
  private readonly normalized: string

  private constructor(normalized: string) {
    this.normalized = normalized
  }

  static create(raw: string): BookerName {
    const normalized = raw.trim().replace(/\s+/g, ' ')

    if (normalized.length === 0) {
      throw new ValidationError('Booker name must not be empty')
    }
    if (normalized.length < 2) {
      throw new ValidationError('Booker name must be at least 2 characters')
    }
    if (normalized.length > 60) {
      throw new ValidationError('Booker name must be at most 60 characters')
    }
    if (/<|>/.test(normalized)) {
      throw new ValidationError('Booker name must not contain < or >')
    }

    return new BookerName(normalized)
  }

  equals(other: BookerName): boolean {
    return this.normalized.toLowerCase() === other.normalized.toLowerCase()
  }

  toString(): string {
    return this.normalized
  }
}
