import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advance, settle, withFakeTimers } from '@hayasedb/nuxt/test/helpers'
import { clearNuxtData, useAnimeListQuery, useRouter } from '#imports'

const { list, genreList } = vi.hoisted(() => ({
  list: vi.fn(),
  genreList: vi.fn(),
}))

mockNuxtImport('useApiClient', () => () => ({
  anime: { list },
  genre: { list: genreList },
}))

type Query = Awaited<ReturnType<typeof useAnimeListQuery>>
let query: Query

const Consumer = defineComponent({
  async setup() {
    query = await useAnimeListQuery({ key: 'explore-test', pageSize: 10 })
    return () => h('span', String(query.total.value))
  },
})

async function mountAt(search: Record<string, string> = {}) {
  const params = new URLSearchParams(search).toString()
  return mountSuspended(Consumer, {
    route: params ? `/explore?${params}` : '/explore',
  })
}

beforeEach(() => {
  clearNuxtData()
  list.mockReset()
  genreList.mockReset()
  list.mockImplementation(async () => ({ items: [], meta: { total: 7 } }))
  genreList.mockImplementation(async () => ({
    items: [],
    meta: { total: 0 },
  }))
})

afterEach(async () => {
  await useRouter().push('/')
})

describe('useAnimeListQuery', () => {
  it('requests the first page with defaults when the url carries no query', async () => {
    const wrapper = await mountAt()
    expect(wrapper.text()).toBe('7')
    expect(list).toHaveBeenCalledWith({
      q: undefined,
      format: undefined,
      status: undefined,
      genre: undefined,
      startYearMin: undefined,
      startYearMax: undefined,
      sort: '-createdAt',
      limit: 10,
      offset: 0,
    })
    expect(query.hasFilters.value).toBe(false)
    wrapper.unmount()
  })

  it('reads filters, sort and page from the url and drops unknown values', async () => {
    const wrapper = await mountAt({
      q: 'naruto',
      format: 'TV',
      status: 'BOGUS',
      yearMin: '2001',
      yearMax: '2005',
      sort: 'title',
      page: '3',
    })
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        q: 'naruto',
        format: 'TV',
        status: undefined,
        startYearMin: 2001,
        startYearMax: 2005,
        sort: 'title',
        offset: 20,
      }),
    )
    expect(query.q.value).toBe('naruto')
    expect(query.page.value).toBe(3)
    expect(query.hasFilters.value).toBe(true)
    wrapper.unmount()
  })

  it('setting a filter rewrites the url, resets the page and refetches', async () => {
    const wrapper = await mountAt({ page: '3', sort: 'title' })
    query.format.value = 'MOVIE'
    await settle()
    const route = useRouter().currentRoute.value
    expect(route.query).toEqual({ format: 'MOVIE', sort: 'title' })
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ format: 'MOVIE', offset: 0, sort: 'title' }),
    )
    wrapper.unmount()
  })

  it('the default sort never appears in the url', async () => {
    const wrapper = await mountAt({ sort: 'title' })
    query.sortKey.value = '-createdAt'
    await settle()
    expect(useRouter().currentRoute.value.query).toEqual({})
    wrapper.unmount()
  })

  it('typing a search replaces the url only after the debounce', async () => {
    const wrapper = await mountAt()
    const fetches = list.mock.calls.length
    await withFakeTimers(async () => {
      query.q.value = 'one'
      await advance(100)
      query.q.value = 'one piece'
      await advance(250)
      expect(useRouter().currentRoute.value.query).toEqual({})
      expect(list).toHaveBeenCalledTimes(fetches)
      await advance(100)
    })
    await settle()
    expect(useRouter().currentRoute.value.query).toEqual({ q: 'one piece' })
    expect(list).toHaveBeenCalledTimes(fetches + 1)
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'one piece', offset: 0 }),
    )
    wrapper.unmount()
  })

  it('pageTo keeps the active filters and omits page 1', async () => {
    const wrapper = await mountAt({ format: 'TV', page: '2' })
    expect(query.pageTo(1)).toEqual({ query: { format: 'TV' } })
    expect(query.pageTo(4)).toEqual({ query: { format: 'TV', page: '4' } })
    wrapper.unmount()
  })

  it('resetFilters clears the search box and navigates to the bare path', async () => {
    const wrapper = await mountAt({ q: 'x', format: 'TV', yearMin: '1999' })
    query.resetFilters()
    await settle()
    expect(query.q.value).toBe('')
    expect(useRouter().currentRoute.value.fullPath).toBe('/explore')
    expect(query.hasFilters.value).toBe(false)
    wrapper.unmount()
  })
})
