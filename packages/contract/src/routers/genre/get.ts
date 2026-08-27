import * as z from 'zod'
import { base } from '../../base'
import { apiKeyAllowed, bff, cacheable } from '../../meta'
import { genreListItemSchema, idSchema } from '../../schemas'

export const getGenreContract = base
  .meta(apiKeyAllowed())
  .meta(bff('web', 'admin'))
  .meta(cacheable(60, 300))
  .route({
    method: 'GET',
    path: '/genres/{id}',
    tags: ['Genre'],
    summary: 'Get a genre',
    description:
      'Fetches a single genre by its identifier. To resolve a name, filter the collection with `GET /genres?name={name}`.',
  })
  .input(z.object({ id: idSchema }))
  .output(genreListItemSchema)
