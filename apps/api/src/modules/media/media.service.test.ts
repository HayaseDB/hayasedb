import { createHash } from 'node:crypto'
import type { Database } from '@hayasedb/db'
import { MEDIA_MAX_DIMENSION, mediaKeyPrefix } from '@hayasedb/domain'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
import { pngBuffer as png } from '../../../test/harness/image'
import type { StorageService } from '../../storage/storage.service'
import { MediaService, processImage } from './media.service'

describe('processImage', () => {
  it('rejects bytes that are not an image', async () => {
    await expect(
      processImage(Buffer.from('definitely not an image')),
    ).rejects.toThrow()
  })

  it('converts to webp and checksums the output bytes', async () => {
    const { output, width, height, blurhash, checksum } = await processImage(
      await png(64, 48),
    )
    expect((await sharp(output).metadata()).format).toBe('webp')
    expect({ width, height }).toEqual({ width: 64, height: 48 })
    expect(checksum).toBe(createHash('sha256').update(output).digest('hex'))
    expect(typeof blurhash).toBe('string')
  })

  it('downsizes oversized images to the maximum dimension', async () => {
    const { width, height } = await processImage(
      await png(MEDIA_MAX_DIMENSION * 2, 100),
    )
    expect({ width, height }).toEqual({
      width: MEDIA_MAX_DIMENSION,
      height: 50,
    })
  })

  it('never enlarges small images', async () => {
    const { width, height } = await processImage(await png(10, 10))
    expect({ width, height }).toEqual({ width: 10, height: 10 })
  })
})

describe('MediaService.ingest', () => {
  it('removes the uploaded object when the row cannot be persisted', async () => {
    const putObject = vi.fn(async () => {})
    const removeByPrefix = vi.fn(async () => {})
    const storage = {
      bucket: 'media',
      putObject,
      removeByPrefix,
    } as unknown as StorageService
    const db = {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      insert: () => ({
        values: () => ({
          onConflictDoNothing: () => ({
            returning: async () => {
              throw new Error('insert failed')
            },
          }),
        }),
      }),
    } as unknown as Database

    const service = new MediaService(storage, db)
    const file = new File([await png(8, 8)], 'in.png', { type: 'image/png' })
    await expect(service.ingest(file)).rejects.toThrow('insert failed')

    const { checksum } = await processImage(await png(8, 8))
    expect(putObject).toHaveBeenCalledTimes(1)
    expect(removeByPrefix).toHaveBeenCalledWith(mediaKeyPrefix(checksum))
  })
})
