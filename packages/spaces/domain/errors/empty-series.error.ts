import { BusinessRuleError } from '@dfs/common'

export class EmptySeriesError extends BusinessRuleError {
  constructor() {
    super('All occurrences were skipped; series cannot be created', 'EMPTY_SERIES')
  }
}
