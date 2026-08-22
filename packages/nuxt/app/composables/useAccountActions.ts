import type {
  ChangeEmailSchema,
  ChangePasswordSchema,
  SetPasswordSchema,
  SocialProvider,
  UpdateProfileSchema,
} from '@hayasedb/contract'

export function useAccountActions() {
  const api = useApiClient()
  const toast = useToast()
  const { loading, run } = useApiAction()

  const origin = () => useRequestURL().origin

  async function updateProfile(input: UpdateProfileSchema): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.updateUser({ name: input.name }), {
        title: 'Update failed',
        success: {
          title: 'Profile updated',
          description: 'Your changes have been saved.',
        },
      }),
    )
  }

  async function uploadAvatar(file: File): Promise<boolean> {
    return Boolean(
      await run(() => api.account.uploadAvatar({ file }), {
        title: 'Upload failed',
        success: {
          title: 'Avatar updated',
          description: 'Your new profile picture has been saved.',
        },
      }),
    )
  }

  async function changeEmail(input: ChangeEmailSchema): Promise<boolean> {
    return Boolean(
      await run(
        () =>
          api.auth.changeEmail({
            newEmail: input.email,
            callbackURL: `${origin()}/`,
          }),
        {
          title: 'Email change failed',
          success: {
            title: 'Check your inbox',
            description:
              'Confirm the change from the link sent to your new address.',
          },
        },
      ),
    )
  }

  async function changePassword(input: ChangePasswordSchema): Promise<boolean> {
    return Boolean(
      await run(
        () =>
          api.auth.changePassword({
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
            revokeOtherSessions: true,
          }),
        {
          title: 'Password change failed',
          success: {
            title: 'Password updated',
            description: 'Your password has been changed.',
          },
        },
      ),
    )
  }

  async function setPassword(input: SetPasswordSchema): Promise<boolean> {
    return Boolean(
      await run(
        () => api.account.setPassword({ newPassword: input.newPassword }),
        {
          title: 'Could not set password',
          success: {
            title: 'Password set',
            description: 'You can now sign in with email and password.',
          },
        },
      ),
    )
  }

  async function resendVerification(email: string): Promise<boolean> {
    let alreadyVerified = false
    const result = await run(
      () =>
        api.auth.sendVerificationEmail({ email, callbackURL: `${origin()}/` }),
      {
        title: 'Could not send email',
        success: {
          title: 'Verification sent',
          description: 'Check your inbox to confirm your email.',
        },
        onError: (error) => {
          if (!isConflictError(error)) return false
          alreadyVerified = true
          toast.add({
            title: 'Already verified',
            description: 'Your email address is already confirmed.',
            color: 'success',
          })
          return true
        },
      },
    )
    return Boolean(result) || alreadyVerified
  }

  async function revokeSession(token: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.revokeSession({ token }), {
        title: 'Could not revoke session',
        success: {
          title: 'Session revoked',
          description: 'That device has been signed out.',
        },
      }),
    )
  }

  async function revokeOtherSessions(): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.revokeOtherSessions(), {
        title: 'Could not revoke sessions',
        success: {
          title: 'Other sessions revoked',
          description: 'All other devices have been signed out.',
        },
      }),
    )
  }

  async function linkSocial(provider: SocialProvider): Promise<void> {
    loading.value = true
    const result = await callApi(
      () =>
        api.auth.linkSocial({
          provider,
          callbackURL: `${origin()}/`,
          errorCallbackURL: `${origin()}/`,
        }),
      { title: 'Could not link account' },
    )
    if (result?.url) {
      window.location.href = result.url
      return
    }
    loading.value = false
    if (result) {
      toast.add({
        title: 'Could not link account',
        description: 'The provider did not return a sign-in link.',
        color: 'error',
      })
    }
  }

  async function unlinkAccount(
    providerId: string,
    accountId?: string,
  ): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.unlinkAccount({ providerId, accountId }), {
        title: 'Could not unlink account',
        success: {
          title: 'Account unlinked',
          description: 'The sign-in method has been removed.',
        },
      }),
    )
  }

  async function signOut(): Promise<void> {
    const result = await run(() => api.auth.signOut(), {
      title: 'Sign out failed',
    })
    if (!result) return

    await refreshAppSession()
  }

  async function deleteAccount(): Promise<boolean> {
    const deleted = await run(() => api.auth.deleteUser({}), {
      title: 'Could not delete account',
      success: {
        title: 'Account deleted',
        description: 'Your account and data have been permanently removed.',
      },
    })
    if (!deleted) return false

    await refreshAppSession()
    return true
  }

  return {
    loading,
    updateProfile,
    uploadAvatar,
    changeEmail,
    changePassword,
    setPassword,
    resendVerification,
    revokeSession,
    revokeOtherSessions,
    linkSocial,
    unlinkAccount,
    signOut,
    deleteAccount,
  }
}
