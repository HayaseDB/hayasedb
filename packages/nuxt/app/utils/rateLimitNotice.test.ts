import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '../../test/setup'
import { notifyRateLimited } from './rateLimitNotice'

describe('notifyRateLimited', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows one warning per ten second window', () => {
    notifyRateLimited()
    notifyRateLimited()
    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add.mock.calls[0]?.[0]).toMatchObject({ color: 'warning' })

    vi.advanceTimersByTime(9_999)
    notifyRateLimited()
    expect(toast.add).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    notifyRateLimited()
    expect(toast.add).toHaveBeenCalledTimes(2)
  })
})
