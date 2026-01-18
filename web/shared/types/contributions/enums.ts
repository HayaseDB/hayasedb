export enum ContributionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EntityType {
  ANIME = 'anime',
  GENRE = 'genre',
  MEDIA = 'media',
}

export enum ContributionSortField {
  CREATED_AT = 'createdAt',
  SUBMITTED_AT = 'submittedAt',
  REVIEWED_AT = 'reviewedAt',
}
