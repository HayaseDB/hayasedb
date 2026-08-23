import { defineComponent, h, nextTick } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { advance, settle, withFakeTimers } from '@hayasedb/nuxt/test/helpers'
import { clearNuxtData, useAdminUsers } from '#imports'

const { listUsers } = vi.hoisted(() => ({ listUsers: vi.fn() }))

mockNuxtImport('useApiClient', () => () => ({
  auth: { admin: { listUsers } },
}))

let users: ReturnType<typeof useAdminUsers>
let keySeq = 0

const Consumer = defineComponent({
  async setup() {
    users = useAdminUsers({ key: `admin-users-${++keySeq}`, pageSize: 5 })
    await nextTick()
    return () => h('span', String(users.total.value))
  },
})

beforeEach(() => {
  clearNuxtData()
  listUsers.mockReset()
  listUsers.mockResolvedValue({ users: [], total: 42 })
})

describe('useAdminUsers', () => {
  it('sends only sort and paging when nothing is filtered', async () => {
    const w = await mountSuspended(Consumer)
    await settle()
    expect(listUsers).toHaveBeenLastCalledWith({
      sortBy: 'createdAt',
      sortDirection: 'desc',
      limit: 5,
      offset: 0,
    })
    expect(w.text()).toBe('42')
    w.unmount()
  })

  it('searches by email when the query contains an @ and by name otherwise, after the debounce', async () => {
    const w = await mountSuspended(Consumer)
    await settle()
    await withFakeTimers(async () => {
      users.q.value = '  ann@example.com '
      await advance(300)
    })
    await settle()
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchValue: 'ann@example.com',
        searchField: 'email',
        searchOperator: 'contains',
      }),
    )
    await withFakeTimers(async () => {
      users.q.value = 'Ann'
      await advance(300)
    })
    await settle()
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchValue: 'Ann', searchField: 'name' }),
    )
    w.unmount()
  })

  it('serializes the tri-state filter and resets to page one when it changes', async () => {
    const w = await mountSuspended(Consumer)
    await settle()
    users.page.value = 3
    await settle()
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 10 }),
    )

    users.filter.value = 'admins'
    await settle()
    expect(users.page.value).toBe(1)
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterField: 'role',
        filterValue: 'admin',
        filterOperator: 'eq',
        offset: 0,
      }),
    )

    users.filter.value = 'banned'
    await settle()
    expect(listUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ filterField: 'banned', filterValue: true }),
    )

    users.filter.value = undefined
    await settle()
    const last = listUsers.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect(last).not.toHaveProperty('filterField')
    w.unmount()
  })
})
