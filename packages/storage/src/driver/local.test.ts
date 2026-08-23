import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createLocalDriver, resolveKey } from './local'
import { describeStorageDriver } from './contract'

async function root(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'hayasedb-storage-'))
}

describeStorageDriver('local', async () =>
  createLocalDriver({
    driver: 'local',
    rootDir: await root(),
    publicBaseUrl: 'http://localhost:3000/api/files',
  }),
)

describe('resolveKey', () => {
  it.each(['../escape.webp', 'a/../../escape.webp', '/etc/passwd', ''])(
    'rejects %j',
    (key) => {
      expect(resolveKey('/srv/storage', key)).toBeNull()
    },
  )

  it('accepts a nested key', () => {
    expect(resolveKey('/srv/storage', 'a/b.webp')).toBe('/srv/storage/a/b.webp')
  })
})

describe('local driver', () => {
  it('refuses to write outside the root', async () => {
    const driver = createLocalDriver({
      driver: 'local',
      rootDir: await root(),
      publicBaseUrl: 'http://localhost',
    })
    await driver.init()
    await expect(
      driver.put('../escape.webp', Buffer.from('x')),
    ).rejects.toThrow(/Invalid storage key/)
  })

  it('returns null for a traversal read', async () => {
    const driver = createLocalDriver({
      driver: 'local',
      rootDir: await root(),
      publicBaseUrl: 'http://localhost',
    })
    await driver.init()
    expect(await driver.get('../../etc/passwd')).toBeNull()
  })

  it('does not serve the metadata sidecar', async () => {
    const dir = await root()
    const driver = createLocalDriver({
      driver: 'local',
      rootDir: dir,
      publicBaseUrl: 'http://localhost',
    })
    await driver.init()
    await driver.put('a.webp', Buffer.from('x'), { contentType: 'image/webp' })

    expect(await driver.get('a.webp.meta.json')).toBeNull()
    expect(
      JSON.parse(await readFile(join(dir, 'a.webp.meta.json'), 'utf8')),
    ).toEqual({
      contentType: 'image/webp',
      cacheControl: null,
    })
  })

  it('ignores a body without its sidecar', async () => {
    const dir = await root()
    const driver = createLocalDriver({
      driver: 'local',
      rootDir: dir,
      publicBaseUrl: 'http://localhost',
    })
    await driver.init()
    await writeFile(join(dir, 'orphan.webp'), 'x')

    expect(await driver.get('orphan.webp')).toBeNull()
  })
})
