import { describe, expect, it, vi } from 'vitest'
import { toast } from '../../test/setup'
import { callApi } from './callApi'

describe('callApi', () => {
  it('returns the result and shows the success toast when configured', async () => {
    const result = await callApi(async () => 42, {
      success: { title: 'Saved', description: 'Done' },
    })
    expect(result).toBe(42)
    expect(toast.add).toHaveBeenCalledWith({
      title: 'Saved',
      description: 'Done',
      color: 'success',
    })
  })

  it('returns null and toasts the server message, falling back when there is none', async () => {
    expect(
      await callApi(
        () => Promise.reject({ code: 'CONFLICT', message: 'Slug taken' }),
        {
          title: 'Could not save',
        },
      ),
    ).toBeNull()
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Could not save',
      description: 'Slug taken',
      color: 'error',
    })

    await callApi(() => Promise.reject(new Error('')), {
      title: 'Could not save',
      fallback: 'Try later',
    })
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Could not save',
      description: 'Try later',
      color: 'error',
    })
  })

  it('stays silent without a title and lets onError swallow handled errors', async () => {
    expect(await callApi(() => Promise.reject(new Error('x')))).toBeNull()
    expect(toast.add).not.toHaveBeenCalled()

    const onError = vi.fn(() => true)
    await callApi(() => Promise.reject(new Error('handled')), {
      title: 'Would toast',
      onError,
    })
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(toast.add).not.toHaveBeenCalled()

    await callApi(() => Promise.reject(new Error('unhandled')), {
      title: 'Will toast',
      onError: () => false,
    })
    expect(toast.add).toHaveBeenCalledTimes(1)
  })
})
