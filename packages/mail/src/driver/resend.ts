import { Resend } from 'resend'
import type { MailDriver, SendEmailInput } from '../types'

export function createResendDriver(from: string, apiKey: string): MailDriver {
  const resend = new Resend(apiKey)

  return {
    async send(input: SendEmailInput): Promise<void> {
      const { error } = await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })
      if (error) {
        throw new Error(`Resend failed to send email: ${error.message}`)
      }
    },
    async close(): Promise<void> {},
  }
}
