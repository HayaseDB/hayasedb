import { base } from '../../base'
import { uploadMediaInputSchema, uploadMediaOutputSchema } from '../../schemas'

export const uploadMediaContract = base
  .route({
    method: 'POST',
    path: '/media',
    tags: ['Media'],
    summary: 'Upload media',
  })
  .input(uploadMediaInputSchema)
  .output(uploadMediaOutputSchema)
