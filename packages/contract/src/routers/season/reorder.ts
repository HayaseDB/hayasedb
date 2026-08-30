import { base } from '../../base'
import { orderingErrors } from '../../errors'
import { bff } from '../../meta'
import {
  animeSeasonListSchema,
  reorderAnimeSeasonsInputSchema,
} from '../../schemas'

export const reorderAnimeSeasonsContract = base
  .errors(orderingErrors)
  .meta(bff('admin'))
  .route({
    method: 'PUT',
    path: '/anime/{animeId}/seasons/order',
    tags: ['Anime seasons'],
    summary: 'Reorder anime seasons',
  })
  .input(reorderAnimeSeasonsInputSchema)
  .output(animeSeasonListSchema)
