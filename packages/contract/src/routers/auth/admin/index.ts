import { adminBanUserContract } from './ban-user'
import { adminCreateUserContract } from './create-user'
import { adminGetUserContract } from './get-user'
import { adminListUserSessionsContract } from './list-user-sessions'
import { adminListUsersContract } from './list-users'
import { adminRemoveUserContract } from './remove-user'
import { adminRevokeUserSessionContract } from './revoke-user-session'
import { adminRevokeUserSessionsContract } from './revoke-user-sessions'
import { adminSetRoleContract } from './set-role'
import { adminSetUserPasswordContract } from './set-user-password'
import { adminUnbanUserContract } from './unban-user'
import { adminUpdateUserContract } from './update-user'

export const adminAuthContract = {
  listUsers: adminListUsersContract,
  getUser: adminGetUserContract,
  listUserSessions: adminListUserSessionsContract,
  createUser: adminCreateUserContract,
  updateUser: adminUpdateUserContract,
  setRole: adminSetRoleContract,
  setUserPassword: adminSetUserPasswordContract,
  banUser: adminBanUserContract,
  unbanUser: adminUnbanUserContract,
  revokeUserSession: adminRevokeUserSessionContract,
  revokeUserSessions: adminRevokeUserSessionsContract,
  removeUser: adminRemoveUserContract,
}

export * from './ban-user'
export * from './create-user'
export * from './get-user'
export * from './list-user-sessions'
export * from './list-users'
export * from './remove-user'
export * from './revoke-user-session'
export * from './revoke-user-sessions'
export * from './set-role'
export * from './set-user-password'
export * from './unban-user'
export * from './update-user'
