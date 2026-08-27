import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { animeDetailSchema, idSchema } from '../../schemas'

export const getAnimeContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(15, 60))
  .route({
    method: 'GET',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Get an anime',
    description:
      'Fetches a single anime by its identifier. To resolve a slug, filter the collection with `GET /anime?slug={slug}`.',
  })
  .input(z.object({ id: idSchema }))
  .output(animeDetailSchema)
