import type { Auth } from '../../auth/auth'

export type AuthApi = Auth['api']

export type AuthBody<K extends keyof AuthApi> = AuthApi[K] extends (
  opts: infer O,
) => unknown
  ? O extends { body: infer B }
    ? B
    : never
  : never

export type AuthQuery<K extends keyof AuthApi> = AuthApi[K] extends (
  opts: infer O,
) => unknown
  ? O extends { query?: infer Q }
    ? Q
    : never
  : never

export type CallbackParams = Record<string, string | undefined>
