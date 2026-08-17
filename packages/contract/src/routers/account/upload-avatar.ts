import { base } from '../../base'
import { bff } from '../../meta'
import {
  uploadAvatarInputSchema,
  uploadAvatarOutputSchema,
} from '../../schemas/media'

export const uploadAvatarContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/account/avatar',
    tags: ['Account'],
    summary: 'Upload avatar',
  })
  .input(uploadAvatarInputSchema)
  .output(uploadAvatarOutputSchema)
