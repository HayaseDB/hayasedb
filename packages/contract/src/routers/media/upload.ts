import { base } from '../../base'
import { bff } from '../../meta'
import { uploadMediaInputSchema, uploadMediaOutputSchema } from '../../schemas'

export const uploadMediaContract = base
  .meta(bff('web', 'admin'))
  .route({
    method: 'POST',
    path: '/media',
    tags: ['Media'],
    summary: 'Upload media',
  })
  .input(uploadMediaInputSchema)
  .output(uploadMediaOutputSchema)
