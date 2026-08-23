import { expect } from '@playwright/test'
import { env } from './env'

interface MailpitSearch {
  messages: { ID: string; Subject: string }[]
}

interface MailpitMessage {
  ID: string
  Subject: string
  HTML: string
  Text: string
}

export async function waitForMail(
  to: string,
  subjectPattern: RegExp,
): Promise<MailpitMessage> {
  let found: MailpitMessage | undefined
  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
        )
        const { messages } = (await res.json()) as MailpitSearch
        const hit = messages.find((m) => subjectPattern.test(m.Subject))
        if (!hit) return false
        found = (await (
          await fetch(`${env.mailpitUrl}/api/v1/message/${hit.ID}`)
        ).json()) as MailpitMessage
        return true
      },
      { timeout: 15_000, message: `mail to ${to} matching ${subjectPattern}` },
    )
    .toBe(true)
  return found!
}

export function linkFrom(message: MailpitMessage, path: string): string {
  const source = `${message.Text}\n${message.HTML}`
  const match = source.match(
    new RegExp(`https?://[^\\s"'<>]*${path.replace(/\//g, '\\/')}[^\\s"'<>]*`),
  )
  if (!match) throw new Error(`No link containing ${path} in mail`)
  return match[0].replace(/&amp;/g, '&')
}
