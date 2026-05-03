import type { Clock } from '../domain/ports/clock.port'

export class FixedClock implements Clock {
  private value: Date

  constructor(value: Date) {
    this.value = new Date(value.getTime())
  }

  now(): Date {
    return new Date(this.value.getTime())
  }

  advance(ms: number): void {
    this.value = new Date(this.value.getTime() + ms)
  }
}
