export type AvailabilityStatus = 'available' | 'occupied'

export type AvailabilityState = 'free' | 'occupied' | 'closed'

export interface SpaceAvailabilityDto {
  spaceSlug: string
  spaceName: string
  status: AvailabilityStatus
  state: AvailabilityState
  occupiedBy?: string
  color?: string | null
}

export class SpaceAvailability {
  private constructor(
    private readonly _spaceSlug: string,
    private readonly _spaceName: string,
    private readonly _status: AvailabilityStatus,
    private readonly _state: AvailabilityState,
    private readonly _occupiedBy?: string,
    private readonly _color?: string | null
  ) {}

  static available(spaceSlug: string, spaceName: string, color?: string | null): SpaceAvailability {
    return new SpaceAvailability(spaceSlug, spaceName, 'available', 'free', undefined, color)
  }

  static occupied(
    spaceSlug: string,
    spaceName: string,
    occupiedBy?: string,
    color?: string | null
  ): SpaceAvailability {
    return new SpaceAvailability(spaceSlug, spaceName, 'occupied', 'occupied', occupiedBy, color)
  }

  static closed(spaceSlug: string, spaceName: string, color?: string | null): SpaceAvailability {
    return new SpaceAvailability(spaceSlug, spaceName, 'occupied', 'closed', undefined, color)
  }

  toDto(): SpaceAvailabilityDto {
    return {
      spaceSlug: this._spaceSlug,
      spaceName: this._spaceName,
      status: this._status,
      state: this._state,
      occupiedBy: this._occupiedBy,
      color: this._color
    }
  }
}
