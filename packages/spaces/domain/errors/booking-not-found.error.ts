import { NotFoundError } from '@dfs/common'

export class BookingNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Booking', id, { id })
  }
}
