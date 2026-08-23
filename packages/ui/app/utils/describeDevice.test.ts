import { describe, expect, it } from 'vitest'
import { describeDevice } from './describeDevice'

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0'
const OPERA_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 OPR/112.0'
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const FIREFOX_ANDROID =
  'Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0'

describe('describeDevice', () => {
  it.each([
    [CHROME_MAC, 'Chrome on macOS'],
    [EDGE_WIN, 'Edge on Windows'],
    [OPERA_LINUX, 'Opera on Linux'],
    [FIREFOX_ANDROID, 'Firefox on Android'],
    [SAFARI_IPHONE, 'Safari on iOS'],
    ['curl/8.6.0', 'Browser on Unknown OS'],
    ['', 'Unknown device'],
    [null, 'Unknown device'],
    [undefined, 'Unknown device'],
  ])('%s → %s', (ua, expected) => {
    expect(describeDevice(ua)).toBe(expected)
  })
})
