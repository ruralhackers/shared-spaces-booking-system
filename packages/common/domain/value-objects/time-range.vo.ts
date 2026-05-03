import { ValidationError } from '../errors'

export interface TimeRangeDto {
  start: string
  end: string
}

export class TimeRange {
  private constructor(
    private readonly start: Date,
    private readonly end: Date
  ) {}

  static create({ start, end }: { start: Date; end: Date }): TimeRange {
    if (end.getTime() <= start.getTime()) {
      throw new ValidationError('TimeRange end must be strictly after start')
    }
    return new TimeRange(start, end)
  }

  static fromDto(dto: TimeRangeDto): TimeRange {
    return TimeRange.create({ start: new Date(dto.start), end: new Date(dto.end) })
  }

  overlaps(other: TimeRange): boolean {
    return this.start.getTime() < other.end.getTime() && other.start.getTime() < this.end.getTime()
  }

  contains(instant: Date): boolean {
    return instant.getTime() >= this.start.getTime() && instant.getTime() < this.end.getTime()
  }

  durationMs(): number {
    return this.end.getTime() - this.start.getTime()
  }

  getStart(): Date {
    return new Date(this.start.getTime())
  }

  getEnd(): Date {
    return new Date(this.end.getTime())
  }

  toDto(): TimeRangeDto {
    return { start: this.start.toISOString(), end: this.end.toISOString() }
  }
}
