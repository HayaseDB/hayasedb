import { ConfigService } from '@nestjs/config'
import { describe, expect, it } from 'vitest'
import { sharedCookieDomain } from './cookie-domain'

function domainFor(web: string, admin: string) {
  const config = new ConfigService({
    WEB_PUBLIC_URL: web,
    ADMIN_PUBLIC_URL: admin,
  })
  return sharedCookieDomain(config as never)
}

describe('sharedCookieDomain', () => {
  it.each([
    ['https://hayasedb.com', 'https://admin.hayasedb.com', '.hayasedb.com'],
    ['https://www.hayasedb.com', 'https://admin.hayasedb.com', '.hayasedb.com'],
    [
      'https://a.dev.hayasedb.com',
      'https://b.dev.hayasedb.com',
      '.dev.hayasedb.com',
    ],
    ['http://localhost:3001', 'http://localhost:3002', undefined],
    ['http://127.0.0.1:3001', 'http://127.0.0.1:3002', undefined],
    ['https://hayasedb.com', 'http://10.0.0.5:3002', undefined],
    ['https://hayasedb.com', 'https://hayasedb.org', undefined],
    ['https://web.example.com', 'https://admin.example.org', undefined],
  ])('%s + %s -> %s', (web, admin, expected) => {
    expect(domainFor(web, admin)).toBe(expected)
  })
})
