import { base } from '../../base'
import { animeDetailSchema, reorderAnimeMediaInputSchema } from '../../schemas'

export const reorderAnimeMediaContract = base
  .route({
    method: 'PUT',
    path: '/anime/{animeId}/media/order',
    tags: ['Anime'],
    summary: 'Reorder anime media',
  })
  .input(reorderAnimeMediaInputSchema)
  .output(animeDetailSchema)
