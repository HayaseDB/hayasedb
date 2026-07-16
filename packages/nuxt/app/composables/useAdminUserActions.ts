import type {
  AdminBanUserSchema,
  AdminCreateUserSchema,
  AdminUpdateUserSchema,
  UserRole,
} from '@hayasedb/contract'

interface AdminActionError {
  status?: number
  code?: string
  message?: string
}

interface RunOptions {
  operation: () => Promise<{ error: AdminActionError | null }>
  success: { title: string; description: string }
  errorTitle: string
}

export function useAdminUserActions() {
  const auth = useAuth()
  const toast = useToast()

  const loading = ref(false)

  async function run(options: RunOptions): Promise<boolean> {
    loading.value = true
    try {
      const { error } = await options.operation()

      if (error) {
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

  function createUser(input: AdminCreateUserSchema): Promise<boolean> {
    return run({
      operation: () => auth.admin.createUser(input),
      success: {
        title: 'User created',
        description: `${input.email} can now sign in.`,
      },
      errorTitle: 'Could not create user',
    })
  }

  function updateUser(
    userId: string,
    input: AdminUpdateUserSchema,
  ): Promise<boolean> {
    return run({
      operation: () => auth.admin.updateUser({ userId, data: input }),
      success: {
        title: 'User updated',
        description: 'The changes have been saved.',
      },
      errorTitle: 'Could not update user',
    })
  }

  function setRole(userId: string, role: UserRole): Promise<boolean> {
    return run({
      operation: () => auth.admin.setRole({ userId, role }),
      success: {
        title: 'Role updated',
        description: `The user is now ${role === 'admin' ? 'an administrator' : 'a regular user'}.`,
      },
      errorTitle: 'Could not change role',
    })
  }

  function setPassword(userId: string, newPassword: string): Promise<boolean> {
    return run({
      operation: () => auth.admin.setUserPassword({ userId, newPassword }),
      success: {
        title: 'Password set',
        description: 'The user can sign in with the new password.',
      },
      errorTitle: 'Could not set password',
    })
  }

  function banUser(
    userId: string,
    input: AdminBanUserSchema,
  ): Promise<boolean> {
    return run({
      operation: async () => {
        const { error } = await auth.admin.banUser({
          userId,
          banReason: input.reason,
          banExpiresIn: input.expiresIn,
        })
        if (error) return { error }
        return await auth.admin.revokeUserSessions({ userId })
      },
      success: {
        title: 'User banned',
        description: 'All of their sessions have been revoked.',
      },
      errorTitle: 'Could not ban user',
    })
  }

  function unbanUser(userId: string): Promise<boolean> {
    return run({
      operation: () => auth.admin.unbanUser({ userId }),
      success: {
        title: 'User unbanned',
        description: 'They can sign in again.',
      },
      errorTitle: 'Could not unban user',
    })
  }

  function revokeSession(sessionToken: string): Promise<boolean> {
    return run({
      operation: () => auth.admin.revokeUserSession({ sessionToken }),
      success: {
        title: 'Session revoked',
        description: 'That device has been signed out.',
      },
      errorTitle: 'Could not revoke session',
    })
  }

  function revokeAllSessions(userId: string): Promise<boolean> {
    return run({
      operation: () => auth.admin.revokeUserSessions({ userId }),
      success: {
        title: 'Sessions revoked',
        description: 'The user has been signed out everywhere.',
      },
      errorTitle: 'Could not revoke sessions',
    })
  }

  function removeUser(userId: string): Promise<boolean> {
    return run({
      operation: () => auth.admin.removeUser({ userId }),
      success: {
        title: 'User deleted',
        description: 'The account has been permanently removed.',
      },
      errorTitle: 'Could not delete user',
    })
  }

  return {
    loading,
    createUser,
    updateUser,
    setRole,
    setPassword,
    banUser,
    unbanUser,
    revokeSession,
    revokeAllSessions,
    removeUser,
  }
}
