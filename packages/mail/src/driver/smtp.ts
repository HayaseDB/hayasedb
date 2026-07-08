import nodemailer from 'nodemailer'
import type { MailDriver, SendEmailInput, SmtpConfig } from '../types'

export function createSmtpDriver(from: string, smtp: SmtpConfig): MailDriver {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  })

  return {
    async send(input: SendEmailInput): Promise<void> {
      await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })
    },
    async close(): Promise<void> {
      transport.close()
    },
  }
}
