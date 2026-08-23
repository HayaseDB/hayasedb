import type { Database } from '@hayasedb/db'
import type { Request } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { AuthFacade } from '../auth/auth.service'
import type { MediaService } from '../media/media.service'
import { AvatarService } from './avatar.service'

describe('AvatarService.upload', () => {
  it('writes the session image before the history row so a failed transaction leaves a valid read model', async () => {
    const url = 'http://storage.test/abc/original.webp'
    const media = {
      ingest: async () => ({ id: 'asset-1', storageKey: 'abc' }),
      publicUrl: () => url,
    } as unknown as MediaService
    const updateUser = vi.fn(async () => ({ headers: new Headers() }))
    const auth = { updateUser } as unknown as AuthFacade
    const db = {
      transaction: async () => {
        throw new Error('transaction failed')
      },
    } as unknown as Database

    const service = new AvatarService(media, db, auth)
    const request = {} as Request
    const file = new File([''], 'a.png', { type: 'image/png' })

    await expect(service.upload('u1', request, file)).rejects.toThrow(
      'transaction failed',
    )
    expect(updateUser).toHaveBeenCalledWith(request, { image: url })
  })
})
