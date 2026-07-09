import { base } from '../../base'
import {
  uploadAvatarInputSchema,
  uploadAvatarOutputSchema,
} from '../../schemas/media'

export const uploadAvatarContract = base
  .route({
    method: 'POST',
    path: '/account/avatar',
    tags: ['Account'],
    summary: 'Upload avatar',
  })
  .input(uploadAvatarInputSchema)
  .output(uploadAvatarOutputSchema)
