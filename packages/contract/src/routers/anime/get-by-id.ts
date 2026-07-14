import * as z from 'zod'
import { base } from '../../base'
import { animeDetailSchema, idSchema } from '../../schemas'

export const getAnimeByIdContract = base
  .route({
    method: 'GET',
    path: '/anime/{id}',
    tags: ['Anime'],
    summary: 'Get anime by id',
  })
  .input(z.object({ id: idSchema }))
  .output(animeDetailSchema)
