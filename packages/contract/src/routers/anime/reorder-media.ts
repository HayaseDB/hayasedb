import { base } from '../../base'
import { orderingErrors } from '../../errors'
import { bff } from '../../meta'
import { animeDetailSchema, reorderAnimeMediaInputSchema } from '../../schemas'

export const reorderAnimeMediaContract = base
  .errors(orderingErrors)
  .meta(bff('admin'))
  .route({
    method: 'PUT',
    path: '/anime/{id}/media/order',
    tags: ['Anime'],
    summary: 'Reorder anime media',
  })
  .input(reorderAnimeMediaInputSchema)
  .output(animeDetailSchema)
