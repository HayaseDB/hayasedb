import type { Request } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { forwardSetCookie } from './forward-set-cookie'

describe('forwardSetCookie', () => {
  it('appends every set-cookie header individually', () => {
    const appendHeader = vi.fn()
    const request = { res: { appendHeader } } as unknown as Request
    const headers = new Headers()
    headers.append('set-cookie', 'a=1; Path=/; HttpOnly')
    headers.append('set-cookie', 'b=2; Path=/; Secure')
    headers.append('x-other', 'ignored')

    forwardSetCookie(request, headers)

    expect(appendHeader.mock.calls).toEqual([
      ['set-cookie', 'a=1; Path=/; HttpOnly'],
      ['set-cookie', 'b=2; Path=/; Secure'],
    ])
  })

  it('does nothing without a response or without cookies', () => {
    expect(() =>
      forwardSetCookie({} as Request, new Headers({ 'set-cookie': 'a=1' })),
    ).not.toThrow()
    const appendHeader = vi.fn()
    forwardSetCookie({ res: { appendHeader } } as never, new Headers())
    expect(appendHeader).not.toHaveBeenCalled()
  })

  it('does nothing when the caller has no headers to forward', () => {
    const appendHeader = vi.fn()
    expect(() =>
      forwardSetCookie({ res: { appendHeader } } as never, undefined),
    ).not.toThrow()
    expect(appendHeader).not.toHaveBeenCalled()
  })
})
