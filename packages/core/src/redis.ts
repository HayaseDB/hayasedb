import Redis from 'ioredis'

export interface SecondaryStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

export function createRedis(url: string): Redis {
  return new Redis(url, { maxRetriesPerRequest: null })
}

export function makeRedisSecondaryStorage(client: Redis): SecondaryStorage {
  return {
    get: (key) => client.get(key),
    set: (key, value, ttl) =>
      (ttl ? client.set(key, value, 'EX', ttl) : client.set(key, value)).then(
        () => undefined,
      ),
    delete: (key) => client.del(key).then(() => undefined),
  }
}

export type { Redis }
