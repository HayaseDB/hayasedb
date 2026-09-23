import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { ANIME_FIELD_META } from '@hayasedb/domain'
import { useFieldChanges } from './useFieldChanges'

interface Doc {
  slug: string
  genreIds: string[]
  translations: Array<Record<string, unknown>>
}

const baselineDoc = (): Doc => ({
  slug: 'cowboy-bebop',
  genreIds: ['a', 'b'],
  translations: [{ locale: 'en', title: 'Cowboy Bebop', description: null }],
})

function setup(overrides: Partial<Parameters<typeof useFieldChanges>[0]> = {}) {
  const state = reactive(baselineDoc()) as Doc
  const fields = useFieldChanges({
    state,
    baseline: baselineDoc,
    meta: ANIME_FIELD_META,
    expand: {
      translations: (next: Doc['translations'], base: Doc['translations']) => {
        const before = base[0]?.title
        const after = next[0]?.title
        return before === after ? [] : ['en.title']
      },
    },
    ...overrides,
  })
  return { state, fields }
}

describe('useFieldChanges', () => {
  it('reports nothing changed when the state matches the baseline', () => {
    const { fields } = setup()
    expect(fields.isDirty.value).toBe(false)
    expect([...fields.changes.value.paths]).toEqual([])
    expect(fields.changedFields.value).toEqual([])
  })

  it('keeps paths a superset of topLevel', () => {
    const { state, fields } = setup()
    state.slug = 'bebop'
    state.translations[0]!.title = 'Kauboi Bibappu'
    const { topLevel, paths } = fields.changes.value
    for (const key of topLevel) expect(paths.has(key)).toBe(true)
    expect(paths.has('translations.en.title')).toBe(true)
  })

  it('never expands a key that is not itself changed', () => {
    const { state, fields } = setup()
    state.slug = 'bebop'
    const paths = [...fields.changes.value.paths]
    expect(paths).toEqual(['slug'])
    expect(paths.some((p) => p.startsWith('translations.'))).toBe(false)
  })

  it('gates display paths behind enabled but never the wire patch', () => {
    const { state, fields } = setup({ enabled: () => false })
    state.slug = 'bebop'
    expect([...fields.changes.value.paths]).toEqual([])
    expect(fields.changedFields.value).toEqual(['slug'])
  })

  it('treats an unordered reorder as unchanged', () => {
    const { state, fields } = setup()
    state.genreIds = ['b', 'a']
    expect(fields.changedFields.value).not.toContain('genreIds')
  })

  it('re-baselines on reset', () => {
    const { state, fields } = setup()
    state.slug = 'bebop'
    expect(fields.isDirty.value).toBe(true)
    fields.reset()
    expect(fields.isDirty.value).toBe(false)
    expect(state.slug).toBe('cowboy-bebop')
  })
})
