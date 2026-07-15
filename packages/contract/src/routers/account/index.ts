import { setPasswordContract } from './set-password'
import { uploadAvatarContract } from './upload-avatar'

export const accountContract = {
  uploadAvatar: uploadAvatarContract,
  setPassword: setPasswordContract,
}

export * from './set-password'
export * from './upload-avatar'
