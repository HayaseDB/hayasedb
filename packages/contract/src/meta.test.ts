import { oc } from '@orpc/contract'
import { base } from './base'
import { describe, expect, it } from 'vitest'
import { apiKeyAllowed, bff, getBffAudiences, isApiKeyAllowed } from './meta'

describe('apiKeyAllowed', () => {
  it('is off by default and on once applied', () => {
    expect(isApiKeyAllowed(base)).toBe(false)
    expect(isApiKeyAllowed(oc.meta(apiKeyAllowed()))).toBe(true)
  })
})

describe('bff', () => {
  it('defaults to no audience', () => {
    expect(getBffAudiences(base)).toEqual([])
  })

  it('merges and dedupes audiences across meta calls', () => {
    const procedure = oc.meta(bff('web')).meta(bff('web', 'admin'))
    expect(getBffAudiences(procedure)).toEqual(['web', 'admin'])
  })

  it('inherits router-level audiences into procedures', () => {
    const router = oc.meta(bff('admin')).router({ x: oc.meta(bff('web')) })
    expect(getBffAudiences(router.x)).toEqual(['admin', 'web'])
  })
})
