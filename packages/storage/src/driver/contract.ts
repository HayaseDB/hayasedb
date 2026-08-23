import { beforeAll, describe, expect, it } from 'vitest'
import type { StorageDriver } from '../types'

export function describeStorageDriver(
  name: string,
  createDriver: () => Promise<StorageDriver> | StorageDriver,
): void {
  describe(`${name} driver contract`, () => {
    let driver: StorageDriver

    beforeAll(async () => {
      driver = await createDriver()
      await driver.init()
    })

    it('round trips a body with its metadata', async () => {
      await driver.put('round/trip.webp', Buffer.from('hello'), {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      })

      const object = await driver.get('round/trip.webp')
      expect(object?.body.toString()).toBe('hello')
      expect(object?.contentType).toBe('image/webp')
      expect(object?.cacheControl).toBe('public, max-age=31536000, immutable')
    })

    it('returns null for a missing key', async () => {
      expect(await driver.get('missing/nothing.webp')).toBeNull()
    })

    it('removes only the keys under the prefix', async () => {
      await driver.put('scoped/a/one.webp', Buffer.from('a'), {
        contentType: 'image/webp',
      })
      await driver.put('scoped/a/two.webp', Buffer.from('b'), {
        contentType: 'image/webp',
      })
      await driver.put('scoped/b/three.webp', Buffer.from('c'), {
        contentType: 'image/webp',
      })

      expect(await driver.removeByPrefix('scoped/a')).toBe(2)
      expect(await driver.get('scoped/a/one.webp')).toBeNull()
      expect(await driver.get('scoped/b/three.webp')).not.toBeNull()
    })

    it('returns zero when the prefix holds nothing', async () => {
      expect(await driver.removeByPrefix('empty/prefix')).toBe(0)
    })

    it('builds a public url containing the key', async () => {
      expect(driver.publicUrl('abc/original.webp')).toContain(
        'abc/original.webp',
      )
    })
  })
}
