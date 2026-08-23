import type { Mailer } from '@hayasedb/mail'

export type MailKind = 'verify' | 'reset' | 'change' | 'welcome'

export interface CapturedMail {
  kind: MailKind
  to: string
  url?: string
  name?: string
}

export interface FakeMailer extends Mailer {
  sent: CapturedMail[]
  lastFor(to: string, kind: MailKind): CapturedMail | undefined
  tokenFrom(mail: CapturedMail | undefined): string
  countFor(to: string, kind: MailKind): number
}

export function createFakeMailer(): FakeMailer {
  const sent: CapturedMail[] = []
  const record = (mail: CapturedMail) => {
    sent.push(mail)
    return Promise.resolve()
  }
  return {
    sent,
    sendVerifyEmail: (to, url) => record({ kind: 'verify', to, url }),
    sendResetPassword: (to, url) => record({ kind: 'reset', to, url }),
    sendChangeEmail: (to, url) => record({ kind: 'change', to, url }),
    sendWelcome: (to, name, url) => record({ kind: 'welcome', to, name, url }),
    close: () => Promise.resolve(),
    lastFor: (to, kind) =>
      [...sent].reverse().find((m) => m.to === to && m.kind === kind),
    countFor: (to, kind) =>
      sent.filter((m) => m.to === to && m.kind === kind).length,
    tokenFrom: (mail) => {
      if (!mail?.url) throw new Error('No mail with a link was captured')
      const token = new URL(mail.url).searchParams.get('token')
      if (!token) throw new Error(`Mail link has no token: ${mail.url}`)
      return token
    },
  }
}
