import * as React from 'react'
import ChangeEmail from '../emails/change-email'
import ResetPassword from '../emails/reset-password'
import VerifyEmail from '../emails/verify-email'
import Welcome from '../emails/welcome'
import { createResendDriver } from './driver/resend'
import { createSmtpDriver } from './driver/smtp'
import { renderEmail } from './render'
import type { MailConfig, MailDriver, Mailer } from './types'

function createDriver(config: MailConfig): MailDriver {
  if (config.driver === 'resend') {
    return createResendDriver(config.from, config.resendApiKey)
  }
  return createSmtpDriver(config.from, config.smtp)
}

export function createMailer(config: MailConfig): Mailer {
  const driver = createDriver(config)

  async function deliver(
    to: string,
    subject: string,
    element: React.ReactElement,
  ): Promise<void> {
    const { html, text } = await renderEmail(element)
    await driver.send({ to, subject, html, text })
  }

  return {
    sendVerifyEmail: (to, url) =>
      deliver(
        to,
        'Verify your Hayasedb email',
        React.createElement(VerifyEmail, { url }),
      ),
    sendResetPassword: (to, url) =>
      deliver(
        to,
        'Reset your Hayasedb password',
        React.createElement(ResetPassword, { url }),
      ),
    sendChangeEmail: (to, url) =>
      deliver(
        to,
        'Confirm your new Hayasedb email',
        React.createElement(ChangeEmail, { url }),
      ),
    sendWelcome: (to, name) =>
      deliver(
        to,
        'Welcome to Hayasedb',
        React.createElement(Welcome, { name }),
      ),
    close: () => driver.close(),
  }
}
