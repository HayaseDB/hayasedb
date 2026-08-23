import { request, type APIRequestContext } from '@playwright/test'
import postgres from 'postgres'
import { ADMIN, env } from './env'

export interface Credentials {
  name: string
  email: string
  password: string
}

let counter = 0

export function uniqueUser(label: string): Credentials {
  counter += 1
  const stamp = `${Date.now().toString(36)}-${process.pid}-${counter}`
  return {
    name: `${label} ${stamp}`,
    email: `${label}-${stamp}@e2e.hayasedb.test`,
    password: `pw-${stamp}-Aa1`,
  }
}

export async function apiContext(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: env.apiUrl,
    extraHTTPHeaders: { 'x-internal-token': env.internalToken },
  })
}

export async function signUp(
  api: APIRequestContext,
  user: Credentials,
): Promise<void> {
  const res = await api.post('/api/auth/sign-up/email', { data: user })
  if (!res.ok())
    throw new Error(`sign-up failed: ${res.status()} ${await res.text()}`)
}

export async function signIn(
  api: APIRequestContext,
  user: Pick<Credentials, 'email' | 'password'>,
): Promise<void> {
  const res = await api.post('/api/auth/sign-in/email', {
    data: { email: user.email, password: user.password },
  })
  if (!res.ok())
    throw new Error(`sign-in failed: ${res.status()} ${await res.text()}`)
}

export async function markVerified(
  email: string,
  role?: 'admin',
): Promise<void> {
  const sql = postgres(env.databaseUrl, { max: 1 })
  try {
    await sql`update "user" set email_verified = true, role = coalesce(${role ?? null}, role) where email = ${email}`
  } finally {
    await sql.end()
  }
}

export async function createVerifiedUser(label: string): Promise<Credentials> {
  const user = uniqueUser(label)
  const api = await apiContext()
  try {
    await signUp(api, user)
  } finally {
    await api.dispose()
  }
  await markVerified(user.email)
  return user
}

export async function seedRelatedPair() {
  const api = await apiContext()
  try {
    await signIn(api, ADMIN)
    const stamp = Date.now().toString(36)
    const create = async (body: Record<string, unknown>) => {
      const res = await api.post('/api/anime', { data: body })
      if (!res.ok())
        throw new Error(
          `create anime failed: ${res.status()} ${await res.text()}`,
        )
      return (await res.json()) as { id: string; slug: string }
    }
    const first = await create({
      slug: `browse-one-${stamp}`,
      titleEnglish: `Browse One ${stamp}`,
      format: 'TV',
      status: 'FINISHED',
      startDate: { year: 2001, month: null, day: null },
    })
    const second = await create({
      slug: `browse-two-${stamp}`,
      titleEnglish: `Browse Two ${stamp}`,
      format: 'MOVIE',
      status: 'FINISHED',
      startDate: { year: 2003, month: 4, day: null },
    })
    const link = await api.patch(`/api/anime/${second.id}`, {
      data: { relations: [{ targetId: first.id, kind: 'SEQUEL' }] },
    })
    if (!link.ok())
      throw new Error(`link failed: ${link.status()} ${await link.text()}`)
    return { first, second, stamp }
  } finally {
    await api.dispose()
  }
}
