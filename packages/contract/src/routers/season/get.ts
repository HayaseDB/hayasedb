import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { animeSeasonSchema, idSchema } from '../../schemas'

export const getAnimeSeasonContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/seasons/{id}',
    tags: ['Anime seasons'],
    summary: 'Get an anime season',
  })
  .input(z.object({ id: idSchema }))
  .output(animeSeasonSchema)
