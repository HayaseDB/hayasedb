import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { animeEpisodeSchema, idSchema } from '../../schemas'

export const getAnimeEpisodeContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/episodes/{id}',
    tags: ['Anime episodes'],
    summary: 'Get an anime episode',
  })
  .input(z.object({ id: idSchema }))
  .output(animeEpisodeSchema)
