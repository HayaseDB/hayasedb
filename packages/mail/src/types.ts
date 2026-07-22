export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

export interface MailDriver {
  send(input: SendEmailInput): Promise<void>
  close(): Promise<void>
}

export interface Mailer {
  sendVerifyEmail(to: string, url: string): Promise<void>
  sendResetPassword(to: string, url: string): Promise<void>
  sendChangeEmail(to: string, url: string): Promise<void>
  sendWelcome(to: string, name?: string, url?: string): Promise<void>
  close(): Promise<void>
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
}

interface BaseMailConfig {
  from: string
}

export type MailConfig =
  | (BaseMailConfig & { driver: 'smtp'; smtp: SmtpConfig })
  | (BaseMailConfig & { driver: 'resend'; resendApiKey: string })
