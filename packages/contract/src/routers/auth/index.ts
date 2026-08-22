import { adminAuthContract } from './admin'
import { apiKeyContract } from './api-key'
import { oauthCallbackContract } from './callback'
import { changeEmailContract } from './change-email'
import { changePasswordContract } from './change-password'
import { deleteUserContract } from './delete-user'
import { getSessionContract } from './get-session'
import { linkSocialContract } from './link-social'
import { listAccountsContract } from './list-accounts'
import { listSessionsContract } from './list-sessions'
import { requestPasswordResetContract } from './request-password-reset'
import { resetPasswordContract } from './reset-password'
import { revokeOtherSessionsContract } from './revoke-other-sessions'
import { revokeSessionContract } from './revoke-session'
import { sendVerificationEmailContract } from './send-verification-email'
import { signInEmailContract } from './sign-in-email'
import { signInSocialContract } from './sign-in-social'
import { signOutContract } from './sign-out'
import { signUpEmailContract } from './sign-up-email'
import { unlinkAccountContract } from './unlink-account'
import { updateUserContract } from './update-user'
import { verifyEmailContract } from './verify-email'

export const authContract = {
  signInEmail: signInEmailContract,
  signUpEmail: signUpEmailContract,
  signOut: signOutContract,
  getSession: getSessionContract,
  signInSocial: signInSocialContract,
  linkSocial: linkSocialContract,
  updateUser: updateUserContract,
  changeEmail: changeEmailContract,
  changePassword: changePasswordContract,
  deleteUser: deleteUserContract,
  listSessions: listSessionsContract,
  revokeSession: revokeSessionContract,
  revokeOtherSessions: revokeOtherSessionsContract,
  listAccounts: listAccountsContract,
  unlinkAccount: unlinkAccountContract,
  verifyEmail: verifyEmailContract,
  sendVerificationEmail: sendVerificationEmailContract,
  requestPasswordReset: requestPasswordResetContract,
  resetPassword: resetPasswordContract,
  callback: oauthCallbackContract,
  admin: adminAuthContract,
  apiKey: apiKeyContract,
}

export * from './admin'
export * from './api-key'
export * from './callback'
export * from './change-email'
export * from './change-password'
export * from './delete-user'
export * from './get-session'
export * from './link-social'
export * from './list-accounts'
export * from './list-sessions'
export * from './request-password-reset'
export * from './reset-password'
export * from './revoke-other-sessions'
export * from './revoke-session'
export * from './send-verification-email'
export * from './sign-in-email'
export * from './sign-in-social'
export * from './sign-out'
export * from './sign-up-email'
export * from './unlink-account'
export * from './update-user'
export * from './verify-email'
