import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { animeDetailSchema, idSchema } from '../../schemas'

export const getAnimeByIdContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'GET',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Get anime by id',
  })
  .input(z.object({ id: idSchema }))
  .output(animeDetailSchema)
