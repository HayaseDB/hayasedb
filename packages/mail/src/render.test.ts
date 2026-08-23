import * as React from 'react'
import { describe, expect, it } from 'vitest'
import ChangeEmail from '../emails/change-email'
import ResetPassword from '../emails/reset-password'
import VerifyEmail from '../emails/verify-email'
import Welcome from '../emails/welcome'
import { renderEmail } from './render'

const url = 'https://hayasedb.test/auth/verify-email?token=ab%2Bcd%26ef'

describe('renderEmail', () => {
  it.each([
    ['verify', React.createElement(VerifyEmail, { url })],
    ['reset', React.createElement(ResetPassword, { url })],
    ['change', React.createElement(ChangeEmail, { url })],
  ])(
    '%s mail links to the exact url in html and text',
    async (_name, element) => {
      const { html, text } = await renderEmail(element)
      expect(html).toContain(`href="${url.replace(/&/g, '&amp;')}"`)
      expect(text).toContain(url)
      expect(html).not.toContain('{url}')
    },
  )

  it('welcome mail greets by name and links to the app', async () => {
    const { html, text } = await renderEmail(
      React.createElement(Welcome, {
        name: 'Sora',
        url: 'https://hayasedb.test',
      }),
    )
    expect(text).toContain('Sora')
    expect(html).toContain('href="https://hayasedb.test"')
  })
})
