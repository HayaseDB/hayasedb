import { defineMeta } from '@orpc/contract'

export const API_KEY_HEADER = 'x-api-key'
export const INTERNAL_TOKEN_HEADER = 'x-internal-token'

const [apiKeyAllowedMeta, getApiKeyAllowed] = defineMeta(
  'apiKeyAllowed',
  (incoming: boolean) => incoming,
)

export const apiKeyAllowed = () => apiKeyAllowedMeta(true)

export const isApiKeyAllowed = (
  procedure: Parameters<typeof getApiKeyAllowed>[0],
) => getApiKeyAllowed(procedure) === true

export type BffAudience = 'web' | 'admin'

const [bffMeta, getBff] = defineMeta(
  'bff',
  (
    incoming: readonly BffAudience[],
    current: readonly BffAudience[] | undefined,
  ) => [...new Set([...(current ?? []), ...incoming])],
)

export const bff = (...audiences: BffAudience[]) => bffMeta(audiences)

export const getBffAudiences = (
  procedure: Parameters<typeof getBff>[0],
): readonly BffAudience[] => getBff(procedure) ?? []
