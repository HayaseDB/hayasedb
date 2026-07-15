import * as z from 'zod'
import { base } from '../../base'
import { animeDetailSchema, slugSchema } from '../../schemas'

export const getAnimeBySlugContract = base
  .route({
    method: 'GET',
    path: '/anime/by-slug/{slug}',
    tags: ['Anime'],
    summary: 'Get anime by slug',
  })
  .input(z.object({ slug: slugSchema }))
  .output(animeDetailSchema)
