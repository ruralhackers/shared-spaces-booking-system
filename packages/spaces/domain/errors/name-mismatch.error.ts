import { BusinessRuleError } from '@dfs/common'

export class NameMismatchError extends BusinessRuleError {
  constructor() {
    super('The provided name does not match the booking name', 'NAME_MISMATCH')
  }
}
