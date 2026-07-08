import { render, toPlainText } from '@react-email/render'
import type { ReactElement } from 'react'

export async function renderEmail(
  element: ReactElement,
): Promise<{ html: string; text: string }> {
  const html = await render(element)
  const text = toPlainText(html)
  return { html, text }
}
