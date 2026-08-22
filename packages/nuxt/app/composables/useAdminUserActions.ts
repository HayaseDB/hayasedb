import type {
  AdminBanUserSchema,
  AdminCreateUserSchema,
  AdminUpdateUserSchema,
  UserRole,
} from '@hayasedb/contract'

export function useAdminUserActions() {
  const api = useApiClient()
  const { loading, run } = useApiAction()

  async function createUser(input: AdminCreateUserSchema): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.createUser(input), {
        title: 'Could not create user',
        success: {
          title: 'User created',
          description: `${input.email} can now sign in.`,
        },
      }),
    )
  }

  async function updateUser(
    id: string,
    input: AdminUpdateUserSchema,
  ): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.updateUser({ id, ...input }), {
        title: 'Could not update user',
        success: {
          title: 'User updated',
          description: 'The changes have been saved.',
        },
      }),
    )
  }

  async function setRole(id: string, role: UserRole): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.setRole({ id, role }), {
        title: 'Could not change role',
        success: {
          title: 'Role updated',
          description: `The user is now ${role === 'admin' ? 'an administrator' : 'a regular user'}.`,
        },
      }),
    )
  }

  async function setPassword(
    id: string,
    newPassword: string,
  ): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.setUserPassword({ id, newPassword }), {
        title: 'Could not set password',
        success: {
          title: 'Password set',
          description: 'The user can sign in with the new password.',
        },
      }),
    )
  }

  async function banUser(
    id: string,
    input: AdminBanUserSchema,
  ): Promise<boolean> {
    return Boolean(
      await run(
        async () => {
          await api.auth.admin.banUser({ id, ...input })
          return api.auth.admin.revokeUserSessions({ id })
        },
        {
          title: 'Could not ban user',
          success: {
            title: 'User banned',
            description: 'All of their sessions have been revoked.',
          },
        },
      ),
    )
  }

  async function unbanUser(id: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.unbanUser({ id }), {
        title: 'Could not unban user',
        success: {
          title: 'User unbanned',
          description: 'They can sign in again.',
        },
      }),
    )
  }

  async function revokeSession(sessionToken: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.revokeUserSession({ sessionToken }), {
        title: 'Could not revoke session',
        success: {
          title: 'Session revoked',
          description: 'That device has been signed out.',
        },
      }),
    )
  }

  async function revokeAllSessions(id: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.revokeUserSessions({ id }), {
        title: 'Could not revoke sessions',
        success: {
          title: 'Sessions revoked',
          description: 'The user has been signed out everywhere.',
        },
      }),
    )
  }

  async function removeUser(id: string): Promise<boolean> {
    return Boolean(
      await run(() => api.auth.admin.removeUser({ id }), {
        title: 'Could not delete user',
        success: {
          title: 'User deleted',
          description: 'The account has been permanently removed.',
        },
      }),
    )
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
