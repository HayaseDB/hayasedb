import { base } from '../../base'
import { bff } from '../../meta'
import { animeDetailSchema, reorderAnimeMediaInputSchema } from '../../schemas'

export const reorderAnimeMediaContract = base
  .meta(bff('admin'))
  .route({
    method: 'PUT',
    path: '/anime/{animeId}/media/order',
    tags: ['Anime'],
    summary: 'Reorder anime media',
  })
  .input(reorderAnimeMediaInputSchema)
  .output(animeDetailSchema)
