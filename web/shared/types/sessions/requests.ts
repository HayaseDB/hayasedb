import type { BasePaginationQuery, SortOrder } from '../common'
import type { SessionSortField } from './enums'

export interface SessionQuery extends BasePaginationQuery {
  sort?: SessionSortField
  order?: SortOrder
  search?: string
}
