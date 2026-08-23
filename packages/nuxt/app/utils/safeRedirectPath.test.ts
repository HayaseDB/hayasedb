import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './safeRedirectPath'

describe('safeRedirectPath', () => {
  it.each([
    ['/', '/'],
    ['/settings', '/settings'],
    ['/anime/cowboy-bebop?tab=media', '/anime/cowboy-bebop?tab=media'],
    ['//evil.com', '/'],
    ['///evil.com', '/'],
    ['/\\evil.com', '/'],
    ['\\/evil.com', '/'],
    ['/settings\\@evil.com', '/'],
    ['/settings\r\nSet-Cookie: a=b', '/'],
    ['/settings\u0000', '/'],
    ['https://evil.com', '/'],
    ['evil.com', '/'],
    ['', '/'],
    [undefined, '/'],
    [null, '/'],
    [['/a', '/b'], '/'],
    [42, '/'],
  ])('maps %j to %j', (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected)
  })
})
