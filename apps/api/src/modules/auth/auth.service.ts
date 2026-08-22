import { Injectable } from '@nestjs/common'
import type { Request } from 'express'
import { BetterAuthFacade } from './better-auth-facade'
import type { AuthBody, CallbackParams } from './auth-api.types'
import { withSessionDates } from './session-output'

@Injectable()
export class AuthFacade extends BetterAuthFacade {
  getSession(request: Request, disableCookieCache?: boolean) {
    return this.api.getSession({
      headers: this.headers(request),
      query: { disableCookieCache },
    })
  }

  signInEmail(request: Request, body: AuthBody<'signInEmail'>) {
    return this.api.signInEmail({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  signUpEmail(request: Request, body: AuthBody<'signUpEmail'>) {
    return this.api.signUpEmail({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  signOut(request: Request) {
    return this.api.signOut({
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  signInSocial(request: Request, body: AuthBody<'signInSocial'>) {
    return this.api.signInSocial({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  linkSocialAccount(request: Request, body: AuthBody<'linkSocialAccount'>) {
    return this.api.linkSocialAccount({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  callbackOAuth(
    request: Request,
    params: { id: string },
    query: CallbackParams,
    body?: CallbackParams,
  ) {
    return this.api.callbackOAuth({
      params,
      query,
      ...(body ? { body } : {}),
      headers: this.headers(request),
      method: request.method as 'GET' | 'POST',
      asResponse: true,
    })
  }

  updateUser(request: Request, body: AuthBody<'updateUser'>) {
    return this.api.updateUser({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  changeEmail(request: Request, body: AuthBody<'changeEmail'>) {
    return this.api.changeEmail({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  changePassword(request: Request, body: AuthBody<'changePassword'>) {
    return this.api.changePassword({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  deleteUser(request: Request, body: AuthBody<'deleteUser'>) {
    return this.api.deleteUser({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  async listSessions(request: Request) {
    const sessions = await this.api.listSessions({
      headers: this.headers(request),
    })
    return sessions.map(withSessionDates)
  }

  revokeSession(request: Request, body: AuthBody<'revokeSession'>) {
    return this.api.revokeSession({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  revokeOtherSessions(request: Request) {
    return this.api.revokeOtherSessions({
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  listUserAccounts(request: Request) {
    return this.api.listUserAccounts({ headers: this.headers(request) })
  }

  unlinkAccount(request: Request, body: AuthBody<'unlinkAccount'>) {
    return this.api.unlinkAccount({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  verifyEmail(request: Request, token: string) {
    return this.api.verifyEmail({
      query: { token },
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  sendVerificationEmail(
    request: Request,
    body: AuthBody<'sendVerificationEmail'>,
  ) {
    return this.api.sendVerificationEmail({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  requestPasswordReset(
    request: Request,
    body: AuthBody<'requestPasswordReset'>,
  ) {
    return this.api.requestPasswordReset({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }

  resetPassword(request: Request, body: AuthBody<'resetPassword'>) {
    return this.api.resetPassword({
      body,
      headers: this.headers(request),
      returnHeaders: true,
    })
  }
}
