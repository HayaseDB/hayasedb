import Redis from 'ioredis'

export interface SecondaryStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

export interface RedisConnection {
  host: string
  port: number
}

export function createRedis({ host, port }: RedisConnection): Redis {
  return new Redis({ host, port, maxRetriesPerRequest: null })
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
