import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import { APIError } from 'better-auth/api'
import { describe, expect, it } from 'vitest'
import { HttpExceptionFilter } from './http-exception.filter'

function run(exception: HttpException | APIError) {
  let status = 0
  let body: unknown
  const response = {
    status(code: number) {
      status = code
      return this
    },
    json(payload: unknown) {
      body = payload
    },
  }
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost
  new HttpExceptionFilter().catch(exception, host)
  return { status, body }
}

describe('HttpExceptionFilter', () => {
  it('renders a Nest 404 as an oRPC NOT_FOUND envelope', () => {
    const { status, body } = run(new NotFoundException('Cannot GET /api/nope'))
    expect(status).toBe(404)
    expect(body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/nope',
    })
  })

  it('maps 400 to BAD_REQUEST', () => {
    const { status, body } = run(new BadRequestException('bad'))
    expect(status).toBe(400)
    expect(body).toMatchObject({ code: 'BAD_REQUEST', message: 'bad' })
  })

  it('falls back to INTERNAL_SERVER_ERROR for statuses without an oRPC code', () => {
    const { status, body } = run(new HttpException('teapot', 418))
    expect(status).toBe(418)
    expect(body).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })
  })

  it('keeps the generic message on a 500 and never attaches a stack', () => {
    const { body } = run(new InternalServerErrorException())
    expect(body).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })
    expect(body).not.toHaveProperty('stack')
    expect(body).toMatchObject({ message: 'Internal Server Error' })
  })

  it('renders a Better Auth error through the auth code map', () => {
    const { status, body } = run(
      new APIError('FORBIDDEN', {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key.',
      }),
    )
    expect(status).toBe(401)
    expect(body).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid API key.',
    })
  })

  it('keeps the Better Auth status when no override applies', () => {
    const { status, body } = run(
      new APIError('TOO_MANY_REQUESTS', { message: 'slow down' }),
    )
    expect(status).toBe(429)
    expect(body).toMatchObject({ code: 'TOO_MANY_REQUESTS' })
  })
})
