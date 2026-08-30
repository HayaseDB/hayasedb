import { base } from '../../base'
import { bff } from '../../meta'
import { animeSeasonSchema, createAnimeSeasonInputSchema } from '../../schemas'

export const createAnimeSeasonContract = base
  .meta(bff('admin'))
  .route({
    method: 'POST',
    path: '/anime/{animeId}/seasons',
    tags: ['Anime seasons'],
    summary: 'Create an anime season',
    successStatus: 201,
  })
  .input(createAnimeSeasonInputSchema)
  .output(animeSeasonSchema)
