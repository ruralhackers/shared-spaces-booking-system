import { Id, type TimeRange, ValidationError } from '@dfs/common'
import { type OpenHours, openHoursContains, validateOpenHours } from './open-hours'

export interface SpaceDto {
  id: string
  slug: string
  displayName: string
  description: string
  openHours: OpenHours
  color: string | null
}

export interface CreateSpaceParams {
  slug: string
  name: string
  description: string
  openHours: OpenHours
  color?: string | null
}

export interface UpdateSpaceDetailsParams {
  name?: string
  description?: string
  openHours?: OpenHours
  color?: string | null
}

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100

function assertValidName(name: string): void {
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Space name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`
    )
  }
}

export class Space {
  private displayName: string
  private description: string
  private openHours: OpenHours
  private color: string | null

  private constructor(
    private readonly id: Id,
    private readonly slug: string,
    displayName: string,
    description: string,
    openHours: OpenHours,
    color: string | null
  ) {
    this.displayName = displayName
    this.description = description
    this.openHours = openHours
    this.color = color
  }

  static create(params: CreateSpaceParams): Space {
    assertValidName(params.name)
    validateOpenHours(params.openHours)
    return new Space(
      Id.generateUniqueId(),
      params.slug,
      params.name,
      params.description,
      params.openHours,
      params.color ?? null
    )
  }

  static fromDto(dto: SpaceDto): Space {
    return new Space(
      Id.fromString(dto.id),
      dto.slug,
      dto.displayName,
      dto.description,
      dto.openHours,
      dto.color
    )
  }

  updateDetails(params: UpdateSpaceDetailsParams): void {
    if (params.name !== undefined) {
      assertValidName(params.name)
      this.displayName = params.name
    }
    if (params.description !== undefined) {
      this.description = params.description
    }
    if (params.openHours !== undefined) {
      validateOpenHours(params.openHours)
      this.openHours = params.openHours
    }
    if (params.color !== undefined) {
      this.color = params.color
    }
  }

  isOpenAt(range: TimeRange, tz: string): boolean {
    return openHoursContains(this.openHours, range, tz)
  }

  toDto(): SpaceDto {
    return {
      id: this.id.toString(),
      slug: this.slug,
      displayName: this.displayName,
      description: this.description,
      openHours: this.openHours,
      color: this.color
    }
  }
}
