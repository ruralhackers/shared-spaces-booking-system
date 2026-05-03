import { ConflictError } from '@dfs/common'

export class BookingOverlapError extends ConflictError {
  constructor(spaceSlug: string) {
    super(
      `A booking already exists for space "${spaceSlug}" that overlaps the requested time range`,
      {
        spaceSlug
      }
    )
  }
}
