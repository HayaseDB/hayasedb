export type ContributionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type EntityType = 'anime' | 'genre'

export interface Contributor {
  email: string
  username: string
  firstName: string | null
  lastName: string | null
}

export interface Contribution {
  id: string
  target: EntityType
  data: Record<string, unknown>
  note: string | null
  status: ContributionStatus
  contributor: Contributor
  reviewer: Contributor | null
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}
