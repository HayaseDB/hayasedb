import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { idSchema } from '../../schemas'

export const removeAnimeEpisodeContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/episodes/{id}',
    tags: ['Anime episodes'],
    summary: 'Delete an anime episode',
    successStatus: 204,
  })
  .input(z.object({ id: idSchema }))
  .output(z.void())
