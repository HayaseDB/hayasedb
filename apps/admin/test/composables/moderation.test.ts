import { defineComponent, h, nextTick } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settle } from '@hayasedb/nuxt/test/helpers'
import {
  clearNuxtData,
  useModerationActions,
  useModerationCounts,
  useModerationQueue,
} from '#imports'

const { api, toast } = vi.hoisted(() => ({
  api: {
    changeset: {
      list: vi.fn(),
      stats: vi.fn(),
      approve: vi.fn(),
      reject: vi.fn(),
      revert: vi.fn(),
    },
    revision: { revert: vi.fn() },
  },
  toast: { add: vi.fn() },
}))

mockNuxtImport('useApiClient', () => () => api)
mockNuxtImport('useToast', () => () => toast)

beforeEach(() => {
  toast.add.mockReset()
  clearNuxtData()
  for (const fn of [...Object.values(api.changeset), api.revision.revert])
    fn.mockReset()
  api.changeset.list.mockResolvedValue({
    items: [{ id: 'c1' }],
    meta: { total: 9 },
  })
  api.changeset.stats.mockResolvedValue({ pending: 3 })
})

describe('useModerationQueue', () => {
  let queue: ReturnType<typeof useModerationQueue>
  const Consumer = defineComponent({
    async setup() {
      queue = useModerationQueue({ pageSize: 4 })
      await nextTick()
      return () => h('span', String(queue.total.value))
    },
  })

  it('starts on the pending tab and resets the page when the status changes', async () => {
    const w = await mountSuspended(Consumer)
    await settle()
    expect(api.changeset.list).toHaveBeenLastCalledWith({
      status: 'pending',
      limit: 4,
      offset: 0,
    })
    expect(w.text()).toBe('9')

    queue.page.value = 2
    await settle()
    expect(api.changeset.list).toHaveBeenLastCalledWith({
      status: 'pending',
      limit: 4,
      offset: 4,
    })

    queue.status.value = 'rejected'
    await settle()
    expect(queue.page.value).toBe(1)
    expect(api.changeset.list).toHaveBeenLastCalledWith({
      status: 'rejected',
      limit: 4,
      offset: 0,
    })
    w.unmount()
  })
})

describe('useModerationActions', () => {
  let actions: ReturnType<typeof useModerationActions>
  let counts: ReturnType<typeof useModerationCounts>
  const Consumer = defineComponent({
    async setup() {
      counts = useModerationCounts()
      actions = useModerationActions()
      await nextTick()
      return () => h('span', String(counts.pendingCount.value))
    },
  })

  it('approve reports applied vs conflicted and refreshes the pending count', async () => {
    const w = await mountSuspended(Consumer)
    await settle()
    expect(w.text()).toBe('3')

    api.changeset.stats.mockResolvedValue({ pending: 2 })
    api.changeset.approve.mockResolvedValue({ status: 'approved' })
    await actions.approve('c1')
    await settle()
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Changeset applied',
      color: 'success',
    })
    expect(w.text()).toBe('2')

    api.changeset.approve.mockResolvedValue({ status: 'pending' })
    await actions.approve('c2')
    expect(toast.add).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: 'Conflicts detected',
        color: 'warning',
      }),
    )
    w.unmount()
  })

  it('tracks which action is busy and clears it on failure, surfacing the server message', async () => {
    const w = await mountSuspended(Consumer)
    let release!: (value: unknown) => void
    api.changeset.reject.mockImplementation(
      () => new Promise((r) => (release = r)),
    )
    const pending = actions.reject('c1', 'spam')
    await nextTick()
    expect(actions.busy.value).toBe(true)
    expect(actions.busyAction.value).toBe('reject')
    release({ status: 'rejected' })
    await pending
    expect(actions.busy.value).toBe(false)
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Changeset rejected',
      color: 'success',
    })

    api.changeset.revert.mockRejectedValue(
      Object.assign(new Error('Already reverted'), { code: 'CONFLICT' }),
    )
    await expect(actions.revertChangeset('c1')).resolves.toBe(false)
    expect(actions.busyAction.value).toBeNull()
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Already reverted',
      color: 'error',
    })

    api.revision.revert.mockRejectedValue(new Error(''))
    await expect(actions.revertToRevision('r1')).resolves.toBe(false)
    expect(toast.add).toHaveBeenLastCalledWith({
      title: 'Failed to revert',
      color: 'error',
    })
    w.unmount()
  })
})
