import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, createTestHttp, type TestApp } from '../harness'

describe('health endpoints', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('answers /api/health anonymously without an API key', async () => {
    const http = createTestHttp(app.baseUrl)
    const response = await http.fetch('/api/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok' })
  })

  it('reports readiness against the real database and redis', async () => {
    const http = createTestHttp(app.baseUrl)
    const response = await http.fetch('/api/ready')
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', redis: 'ok' },
    })
  })

  it('returns a 503 SERVICE_UNAVAILABLE envelope once redis is gone', async () => {
    await app.redis.disconnect()
    try {
      const http = createTestHttp(app.baseUrl)
      const response = await http.fetch('/api/ready')
      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
      })
    } finally {
      await app.redis.connect()
    }
  })

  it('renders unknown routes as the oRPC NOT_FOUND envelope', async () => {
    const http = createTestHttp(app.baseUrl)
    const response = await http.fetch('/api/nope')
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
