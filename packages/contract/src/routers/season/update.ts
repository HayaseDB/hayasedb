import { base } from '../../base'
import { bff } from '../../meta'
import { animeSeasonSchema, updateAnimeSeasonInputSchema } from '../../schemas'

export const updateAnimeSeasonContract = base
  .meta(bff('admin'))
  .route({
    method: 'PATCH',
    path: '/seasons/{id}',
    tags: ['Anime seasons'],
    summary: 'Update an anime season',
  })
  .input(updateAnimeSeasonInputSchema)
  .output(animeSeasonSchema)
