import type { OpenHoursWindow } from '../../domain/open-hours'
import type { SpaceDto as DomainSpaceDto } from '../../domain/space.entity'

export interface SpaceDto extends DomainSpaceDto {
  isOccupiedNow: boolean
  currentStatus: {
    state: 'free' | 'occupied' | 'closed'
    freeUntil?: string
    freeWindowMinutes?: number
    occupiedBy?: string
    occupiedUntil?: string
    nextOpenAt?: string | null
  }
}

export interface BookingDto {
  id: string
  spaceId: string
  seriesId: string | null
  spaceSlug: string
  spaceDisplayName: string
  bookerName: string
  startsAt: string
  endsAt: string
  status: 'active' | 'cancelled'
  createdAt: string
  cancelledAt: string | null
  cancelledBy: 'booker' | 'admin' | null
}

export interface DayViewDto {
  space: DomainSpaceDto
  date: string
  openHoursForDay: OpenHoursWindow[]
  bookings: BookingDto[]
}
