import { BusinessRuleError } from '@dfs/common'

export class OutsideOpenHoursError extends BusinessRuleError {
  constructor(spaceSlug: string) {
    super(
      `The requested time range is outside the open hours for space "${spaceSlug}"`,
      'OUTSIDE_OPEN_HOURS',
      {
        spaceSlug
      }
    )
  }
}
