import { Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { BetterAuthFacade } from './better-auth-facade'
import type { AuthBody, AuthQuery } from './auth-api.types'
import { withSessionDates } from './session-output'

@Injectable()
export class AdminFacade extends BetterAuthFacade {
  listUsers(request: Request, query: AuthQuery<'listUsers'>) {
    return this.api.listUsers({ query, headers: this.headers(request) })
  }

  getUser(request: Request, id: string) {
    return this.api.getUser({ query: { id }, headers: this.headers(request) })
  }

  async listUserSessions(request: Request, userId: string) {
    const { sessions } = await this.api.listUserSessions({
      body: { userId },
      headers: this.headers(request),
    })
    return { sessions: sessions.map(withSessionDates) }
  }

  createUser(request: Request, body: AuthBody<'createUser'>) {
    return this.api.createUser({ body, headers: this.headers(request) })
  }

  updateUser(request: Request, body: AuthBody<'adminUpdateUser'>) {
    return this.api.adminUpdateUser({ body, headers: this.headers(request) })
  }

  setRole(request: Request, body: AuthBody<'setRole'>) {
    return this.api.setRole({ body, headers: this.headers(request) })
  }

  setUserPassword(request: Request, body: AuthBody<'setUserPassword'>) {
    return this.api.setUserPassword({ body, headers: this.headers(request) })
  }

  banUser(request: Request, body: AuthBody<'banUser'>) {
    return this.api.banUser({ body, headers: this.headers(request) })
  }

  unbanUser(request: Request, body: AuthBody<'unbanUser'>) {
    return this.api.unbanUser({ body, headers: this.headers(request) })
  }

  revokeUserSession(request: Request, sessionToken: string) {
    return this.api.revokeUserSession({
      body: { sessionToken },
      headers: this.headers(request),
    })
  }

  revokeUserSessions(request: Request, userId: string) {
    return this.api.revokeUserSessions({
      body: { userId },
      headers: this.headers(request),
    })
  }

  removeUser(request: Request, userId: string) {
    return this.api.removeUser({
      body: { userId },
      headers: this.headers(request),
    })
  }
}
