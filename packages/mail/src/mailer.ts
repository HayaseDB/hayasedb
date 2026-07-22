import * as React from 'react'
import ChangeEmail, {
  subject as changeEmailSubject,
} from '../emails/change-email'
import ResetPassword, {
  subject as resetPasswordSubject,
} from '../emails/reset-password'
import VerifyEmail, {
  subject as verifyEmailSubject,
} from '../emails/verify-email'
import Welcome, { subject as welcomeSubject } from '../emails/welcome'
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
        verifyEmailSubject,
        React.createElement(VerifyEmail, { url }),
      ),
    sendResetPassword: (to, url) =>
      deliver(
        to,
        resetPasswordSubject,
        React.createElement(ResetPassword, { url }),
      ),
    sendChangeEmail: (to, url) =>
      deliver(
        to,
        changeEmailSubject,
        React.createElement(ChangeEmail, { url }),
      ),
    sendWelcome: (to, name, url) =>
      deliver(to, welcomeSubject, React.createElement(Welcome, { name, url })),
    close: () => driver.close(),
  }
}
