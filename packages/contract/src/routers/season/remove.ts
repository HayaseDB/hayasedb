import * as z from 'zod'
import { base } from '../../base'
import { bff } from '../../meta'
import { idSchema } from '../../schemas'

export const removeAnimeSeasonContract = base
  .meta(bff('admin'))
  .route({
    method: 'DELETE',
    path: '/seasons/{id}',
    tags: ['Anime seasons'],
    summary: 'Delete an anime season',
    successStatus: 204,
  })
  .input(z.object({ id: idSchema }))
  .output(z.void())
