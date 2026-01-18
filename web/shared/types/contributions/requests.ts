import type { BasePaginationQuery, SortOrder } from '../common'
import type { ContributionSortField, ContributionStatus, EntityType } from './enums'

export interface CreateContributionRequest {
  target: EntityType
  data: Record<string, unknown>
  note?: string
}

export interface UpdateContributionRequest {
  data: Record<string, unknown>
  note?: string
}

export interface ResolveContributionRequest {
  note?: string
}

export interface ContributionQuery extends BasePaginationQuery {
  status?: ContributionStatus
  target?: EntityType
  sort?: ContributionSortField
  order?: SortOrder
}
