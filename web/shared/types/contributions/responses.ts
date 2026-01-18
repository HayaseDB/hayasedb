import type { Paginated } from '../common'
import type { ContributionStatus, EntityType } from './enums'

export interface ContributorResponse {
  email: string
  username: string
  firstName: string | null
  lastName: string | null
}

export interface ContributionResponse {
  id: string
  target: EntityType
  data: Record<string, unknown>
  note: string | null
  status: ContributionStatus
  contributor: ContributorResponse
  reviewer: ContributorResponse | null
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PaginatedContributionResponse = Paginated<ContributionResponse>
