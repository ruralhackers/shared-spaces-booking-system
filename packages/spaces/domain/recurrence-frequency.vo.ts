import { ValidationError } from '@dfs/common'

export type RecurrenceFrequencyValue = 'daily' | 'weekly'

export class RecurrenceFrequency {
  private constructor(private readonly value: RecurrenceFrequencyValue) {}

  static create(value: string): RecurrenceFrequency {
    if (value !== 'daily' && value !== 'weekly') {
      throw new ValidationError('Frequency must be daily or weekly')
    }
    return new RecurrenceFrequency(value)
  }

  toString(): string {
    return this.value
  }

  equals(other: RecurrenceFrequency): boolean {
    return this.value === other.value
  }
}
