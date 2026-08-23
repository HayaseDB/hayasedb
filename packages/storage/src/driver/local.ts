import {
  mkdir,
  readFile,
  readdir,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import type {
  LocalStorageConfig,
  PutObjectOptions,
  StorageDriver,
  StoredObject,
} from '../types'

const META_SUFFIX = '.meta.json'
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

interface ObjectMeta {
  contentType: string
  cacheControl: string | null
}

export function resolveKey(rootDir: string, key: string): string | null {
  if (!key) return null

  const root = resolve(rootDir)
  const target = resolve(root, key)
  if (target !== root && !target.startsWith(root + sep)) return null
  return target
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}

async function listFiles(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (isMissing(error)) return []
    throw error
  }

  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else files.push(path)
  }
  return files
}

async function prune(dir: string, root: string): Promise<void> {
  let current = dir
  while (current.startsWith(root + sep)) {
    try {
      await rmdir(current)
    } catch {
      return
    }
    current = dirname(current)
  }
}

export function createLocalDriver(config: LocalStorageConfig): StorageDriver {
  const root = resolve(config.rootDir)
  const publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '')

  return {
    provider: 'local',
    container: root,

    async init() {
      await mkdir(root, { recursive: true })
    },

    async put(key, body, options: PutObjectOptions = {}) {
      const target = resolveKey(root, key)
      if (!target) throw new Error(`Invalid storage key: ${key}`)

      const meta: ObjectMeta = {
        contentType: options.contentType ?? DEFAULT_CONTENT_TYPE,
        cacheControl: options.cacheControl ?? null,
      }

      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, body)
      await writeFile(`${target}${META_SUFFIX}`, JSON.stringify(meta))
    },

    async get(key): Promise<StoredObject | null> {
      const target = resolveKey(root, key)
      if (!target || target.endsWith(META_SUFFIX)) return null

      try {
        const [body, raw] = await Promise.all([
          readFile(target),
          readFile(`${target}${META_SUFFIX}`, 'utf8'),
        ])
        const meta = JSON.parse(raw) as ObjectMeta
        return {
          body,
          contentType: meta.contentType ?? DEFAULT_CONTENT_TYPE,
          cacheControl: meta.cacheControl ?? null,
        }
      } catch (error) {
        if (isMissing(error)) return null
        throw error
      }
    },

    async removeByPrefix(prefix) {
      const target = resolveKey(root, prefix)
      if (!target) return 0

      const files = await listFiles(target)
      if (files.length === 0) return 0

      await Promise.all(files.map((file) => rm(file, { force: true })))
      await prune(target, root)
      return files.filter((file) => !file.endsWith(META_SUFFIX)).length
    },

    publicUrl(key) {
      return `${publicBaseUrl}/${key}`
    },
  }
}
