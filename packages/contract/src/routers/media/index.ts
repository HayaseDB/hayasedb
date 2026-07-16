import { sweepMediaContract } from './sweep'
import { uploadMediaContract } from './upload'

export const mediaContract = {
  upload: uploadMediaContract,
  sweep: sweepMediaContract,
}

export * from './sweep'
export * from './upload'
