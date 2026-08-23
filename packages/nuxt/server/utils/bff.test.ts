import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import { prepareProxyHeaders, resolveBffProfile } from './bff'

function eventWith(headers: Record<string, string | string[]>) {
  const req = new IncomingMessage(new Socket())
  req.method = 'GET'
  req.url = '/api/auth/session'
  req.headers = headers
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('resolveBffProfile', () => {
  it('falls back to the web profile for anything that is not admin', () => {
    expect(resolveBffProfile('admin').audience).toBe('admin')
    expect(resolveBffProfile('web').audience).toBe('web')
    expect(resolveBffProfile('').audience).toBe('web')
    expect(resolveBffProfile('ADMIN').audience).toBe('web')
  })

  it('allows only contract routes under /api for the audience', () => {
    const web = resolveBffProfile('web')
    const admin = resolveBffProfile('admin')
    expect(web.allows('GET', '/api/auth/session')).toBe(true)
    expect(web.allows('POST', '/api/auth/sign-in/email')).toBe(true)
    expect(web.allows('GET', '/api/anime')).toBe(true)
    expect(web.allows('GET', '/auth/session')).toBe(false)
    expect(web.allows('GET', '/api/')).toBe(false)
    expect(web.allows('GET', '/api/docs')).toBe(false)
    expect(web.allows('GET', '/api/changesets')).toBe(true)
    expect(web.allows('GET', '/api/auth/admin/users')).toBe(false)
    expect(admin.allows('GET', '/api/auth/admin/users')).toBe(true)
    expect(admin.allows('GET', '/api/auth/admin/users/u_1/sessions')).toBe(true)
    expect(web.allows('POST', '/api/anime')).toBe(false)
    expect(admin.allows('POST', '/api/anime')).toBe(true)
    expect(
      web.allows('DELETE', '/api/anime/00000000-0000-7000-8000-000000000000'),
    ).toBe(false)
    expect(
      admin.allows('DELETE', '/api/anime/00000000-0000-7000-8000-000000000000'),
    ).toBe(true)
    expect(admin.allows('PATCH', '/api/auth/session')).toBe(false)
  })
})

describe('prepareProxyHeaders', () => {
  it('strips spoofable headers from the inbound request and injects trusted ones', () => {
    const event = eventWith({
      host: 'hayasedb.com',
      cookie: 'better-auth.session_token=abc',
      'x-internal-token': 'forged',
      'x-api-key': 'forged-key',
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      'x-forwarded-host': 'evil.com',
      'x-forwarded-proto': 'gopher',
      'user-agent': 'ua',
    })

    const headers = prepareProxyHeaders(event, 'secret-token')

    expect(headers).toEqual({
      'x-forwarded-for': '203.0.113.9',
      'x-internal-token': 'secret-token',
    })
    expect(event.node.req.headers).toEqual({
      host: 'hayasedb.com',
      cookie: 'better-auth.session_token=abc',
      'user-agent': 'ua',
    })
  })

  it('never adds an internal token header when none is configured', () => {
    const event = eventWith({ 'x-internal-token': 'forged' })
    const headers = prepareProxyHeaders(event, '')
    expect(headers).toEqual({})
    expect(event.node.req.headers).toEqual({})
  })

  it('drops the client token even when the header name is not lowercase', () => {
    const event = eventWith({
      'X-Internal-Token': 'forged',
      'X-API-KEY': 'forged-key',
      'X-Forwarded-Host': 'evil.com',
      accept: 'application/json',
    })
    const headers = prepareProxyHeaders(event, 'secret-token')
    expect(headers).toEqual({ 'x-internal-token': 'secret-token' })
    expect(event.node.req.headers).toEqual({ accept: 'application/json' })
  })

  it('drops array-valued spoofable headers', () => {
    const event = eventWith({
      'x-forwarded-for': ['203.0.113.9', '198.51.100.7'],
      'x-api-key': ['a', 'b'],
    })
    const headers = prepareProxyHeaders(event, 'secret-token')
    expect(event.node.req.headers).toEqual({})
    expect(headers).toEqual({
      'x-forwarded-for': '203.0.113.9',
      'x-internal-token': 'secret-token',
    })
  })

  it('omits x-forwarded-for when the client ip is unknown', () => {
    const event = eventWith({ accept: 'text/html' })
    const headers = prepareProxyHeaders(event, 'secret-token')
    expect(headers).toEqual({ 'x-internal-token': 'secret-token' })
    expect(headers).not.toHaveProperty('x-forwarded-for')
  })

  it('only forwards the first hop of a forwarded-for chain', () => {
    const event = eventWith({ 'x-forwarded-for': ' 203.0.113.9 ,10.0.0.1' })
    const headers = prepareProxyHeaders(event, '')
    expect(headers).toEqual({ 'x-forwarded-for': '203.0.113.9' })
  })
})
