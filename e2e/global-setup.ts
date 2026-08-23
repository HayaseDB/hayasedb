import { apiContext, markVerified } from './fixtures/api'
import { ADMIN, env } from './fixtures/env'

export default async function globalSetup() {
  const api = await apiContext()
  try {
    const res = await api.post('/api/auth/sign-up/email', { data: ADMIN })
    if (!res.ok() && res.status() !== 422 && res.status() !== 409) {
      throw new Error(
        `admin sign-up failed: ${res.status()} ${await res.text()}`,
      )
    }
    await markVerified(ADMIN.email, 'admin')
    const mail = await fetch(`${env.mailpitUrl}/api/v1/messages`, {
      method: 'DELETE',
    })
    if (!mail.ok) throw new Error(`mailpit reset failed: ${mail.status}`)
  } finally {
    await api.dispose()
  }
}
