export interface CreateUserRequest {
  email: string
  password: string
  username: string
  firstName: string
  lastName: string
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface DeleteAccountRequest {
  password: string
}
