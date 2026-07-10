import type {
  ChangeEmailSchema,
  ChangePasswordSchema,
  SetPasswordSchema,
  SocialProvider,
  UpdateProfileSchema,
} from '@hayasedb/contract'

interface AuthActionError {
  status?: number
  code?: string
  message?: string
}

interface RunOptions {
  operation: () => Promise<{ error: AuthActionError | null }>
  success: { title: string; description: string }
  errorTitle: string
  handleStale?: boolean
  onError?: (error: AuthActionError) => boolean
}

export function useAccountActions() {
  const auth = useAuth()
  const api = useApiClient()
  const toast = useToast()
  const router = useRouter()

  const loading = ref(false)

  const origin = () => useRequestURL().origin

  async function handleStaleSession(error: AuthActionError): Promise<boolean> {
    if (error.status !== 401 && error.status !== 500) return false
    const { data } = await auth.getSession({
      query: { disableCookieCache: true },
    })
    if (data?.user) return false
    await auth.signOut().catch(() => {})
    toast.add({
      title: 'Session expired',
      description: 'Please sign in again to continue.',
      color: 'warning',
    })
    await router.push('/login')
    return true
  }

  async function run(options: RunOptions): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await options.operation()

      if (error) {
        if (options.handleStale && (await handleStaleSession(error))) {
          return false
        }
        if (options.onError?.(error)) return true
        toast.add({
          title: options.errorTitle,
          description: error.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      toast.add({ ...options.success, color: 'success' })
      return true
    } finally {
      loading.value = false
    }
  }

  function updateProfile(input: UpdateProfileSchema): Promise<boolean> {
    return run({
      operation: () => auth.updateUser({ name: input.name }),
      success: {
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      },
      errorTitle: 'Update failed',
      handleStale: true,
    })
  }

  async function uploadAvatar(file: File): Promise<boolean> {
    loading.value = true
    try {
      await api.account.uploadAvatar({ file })

      toast.add({
        title: 'Avatar updated',
        description: 'Your new profile picture has been saved.',
        color: 'success',
      })
      return true
    } catch (error) {
      toast.add({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        color: 'error',
      })
      return false
    } finally {
      loading.value = false
    }
  }

  function changeEmail(input: ChangeEmailSchema): Promise<boolean> {
    return run({
      operation: () =>
        auth.changeEmail({
          newEmail: input.email,
          callbackURL: `${origin()}/`,
        }),
      success: {
        title: 'Check your inbox',
        description:
          'Confirm the change from the link sent to your new address.',
      },
      errorTitle: 'Email change failed',
    })
  }

  function changePassword(input: ChangePasswordSchema): Promise<boolean> {
    return run({
      operation: () =>
        auth.changePassword({
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          revokeOtherSessions: true,
        }),
      success: {
        title: 'Password updated',
        description: 'Your password has been changed.',
      },
      errorTitle: 'Password change failed',
    })
  }

  async function setPassword(input: SetPasswordSchema): Promise<boolean> {
    loading.value = true
    try {
      await api.account.setPassword({ newPassword: input.newPassword })

      toast.add({
        title: 'Password set',
        description: 'You can now sign in with email and password.',
        color: 'success',
      })
      return true
    } catch (error) {
      toast.add({
        title: 'Could not set password',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        color: 'error',
      })
      return false
    } finally {
      loading.value = false
    }
  }

  function resendVerification(email: string): Promise<boolean> {
    return run({
      operation: () =>
        auth.sendVerificationEmail({ email, callbackURL: `${origin()}/` }),
      success: {
        title: 'Verification sent',
        description: 'Check your inbox to confirm your email.',
      },
      errorTitle: 'Could not send email',
      onError: (error) => {
        if (
          error.code ===
          'YOU_CAN_ONLY_SEND_A_VERIFICATION_EMAIL_TO_AN_UNVERIFIED_EMAIL'
        ) {
          toast.add({
            title: 'Already verified',
            description: 'Your email address is already confirmed.',
            color: 'success',
          })
          return true
        }
        return false
      },
    })
  }

  function revokeSession(token: string): Promise<boolean> {
    return run({
      operation: () => auth.revokeSession({ token }),
      success: {
        title: 'Session revoked',
        description: 'That device has been signed out.',
      },
      errorTitle: 'Could not revoke session',
    })
  }

  function revokeOtherSessions(): Promise<boolean> {
    return run({
      operation: () => auth.revokeOtherSessions(),
      success: {
        title: 'Other sessions revoked',
        description: 'All other devices have been signed out.',
      },
      errorTitle: 'Could not revoke sessions',
    })
  }

  async function linkSocial(provider: SocialProvider): Promise<void> {
    loading.value = true
    try {
      await auth.linkSocial({
        provider,
        callbackURL: `${origin()}/`,
        errorCallbackURL: `${origin()}/`,
      })
    } catch (error) {
      loading.value = false
      throw error
    }
  }

  function unlinkAccount(
    providerId: string,
    accountId?: string,
  ): Promise<boolean> {
    return run({
      operation: () => auth.unlinkAccount({ providerId, accountId }),
      success: {
        title: 'Account unlinked',
        description: 'The sign-in method has been removed.',
      },
      errorTitle: 'Could not unlink account',
    })
  }

  async function signOut(): Promise<void> {
    await auth.signOut()
    await router.push('/login')
  }

  async function deleteAccount(): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await auth.deleteUser({})

      if (error) {
        toast.add({
          title: 'Could not delete account',
          description: error.message ?? 'Please try again.',
          color: 'error',
        })
        return false
      }

      toast.add({
        title: 'Account deleted',
        description: 'Your account and data have been permanently removed.',
        color: 'success',
      })
      await router.push('/login')
      return true
    } finally {
      loading.value = false
    }
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
