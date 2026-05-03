import type { Uuid } from '../value-objects/uuid.vo'
export interface Deletable<_In> {
  delete(id: Uuid): Promise<void>
}
