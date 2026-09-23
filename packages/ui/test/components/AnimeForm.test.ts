import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick, reactive, ref } from 'vue'
import { ANIME_FIELD_META } from '@hayasedb/domain'
import AnimeForm from '../../app/components/anime/AnimeForm.vue'
import {
  buildAnimeFormState,
  expandAnimeTranslationPaths,
} from '../../app/utils/animeForm'
import { useFieldChanges } from '../../../nuxt/app/composables/useFieldChanges'
import type { AnimeMediaController } from '../../app/utils/animeMedia'
import { UUID } from '../contribution-fixtures'

const media: AnimeMediaController = {
  cover: { value: null },
  banner: { value: null },
  gallery: { value: [] },
  setSingle: vi.fn(),
  removeSingle: vi.fn(),
  addGallery: vi.fn(),
  removeGallery: vi.fn(),
  reorderGallery: vi.fn(),
}

const genres = [
  { id: UUID(1), name: 'Action' },
  { id: UUID(2), name: 'Drama' },
]

async function mount(overrides: Record<string, unknown> = {}) {
  const state = ref(buildAnimeFormState())
  const onSubmit = vi.fn()
  const onCreateGenre = vi.fn()
  const wrapper = await mountSuspended(AnimeForm, {
    props: {
      state: state.value,
      'onUpdate:state': (next: typeof state.value) => {
        state.value = next
      },
      media,
      genres,
      proposedGenres: [{ id: UUID(3), name: 'Isekai' }],
      isEdit: false,
      isDirty: true,
      saving: false,
      onSubmit,
      onCreateGenre,
      onSearchAnime: async () => [],
      ...overrides,
    },
  })
  return { wrapper, state, onSubmit, onCreateGenre }
}

const genreSelect = (wrapper: Awaited<ReturnType<typeof mount>>['wrapper']) =>
  wrapper
    .findAllComponents({ name: 'USelectMenu' })
    .find((component) => component.props('id') === 'anime-genres')!

describe('AnimeForm', () => {
  it('rejects an invalid slug before calling onSubmit', async () => {
    const { wrapper, onSubmit } = await mount()
    await wrapper.find('#anime-slug').setValue('Not A Slug')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain(
        'Use lowercase letters, numbers and single hyphens',
      ),
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the schema-parsed payload with the localized title trimmed', async () => {
    const { wrapper, onSubmit } = await mount()
    await wrapper.find('#anime-slug').setValue('cowboy-bebop')
    await wrapper.find('#anime-title').setValue('  Cowboy Bebop ')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0]![0]
    expect(payload).toMatchObject({
      slug: 'cowboy-bebop',
      genreIds: [],
      translations: [
        expect.objectContaining({
          locale: 'en',
          title: 'Cowboy Bebop',
          original: true,
        }),
      ],
    })
  })

  it('reuses an existing genre instead of proposing a duplicate name', async () => {
    const { wrapper, state, onCreateGenre } = await mount()
    genreSelect(wrapper).vm.$emit('create', '  action ')
    await vi.waitFor(() => expect(state.value.genreIds).toEqual([UUID(1)]))
    genreSelect(wrapper).vm.$emit('create', 'ISEKAI')
    await vi.waitFor(() =>
      expect(state.value.genreIds).toEqual([UUID(1), UUID(3)]),
    )
    genreSelect(wrapper).vm.$emit('create', 'Action')
    expect(state.value.genreIds).toEqual([UUID(1), UUID(3)])
    expect(onCreateGenre).not.toHaveBeenCalled()
  })

  it('proposes a trimmed new genre and ignores blank names', async () => {
    const { wrapper, onCreateGenre } = await mount()
    genreSelect(wrapper).vm.$emit('create', '   ')
    genreSelect(wrapper).vm.$emit('create', '  Mecha ')
    expect(onCreateGenre).toHaveBeenCalledTimes(1)
    expect(onCreateGenre).toHaveBeenCalledWith('Mecha')
  })

  it('lists proposed genres with a new marker and hides creation without a handler', async () => {
    const { wrapper } = await mount({ onCreateGenre: undefined })
    const items = genreSelect(wrapper).props('items') as { label: string }[]
    expect(items.map((i) => i.label)).toEqual([
      'Action',
      'Drama',
      'Isekai (new)',
    ])
    expect(genreSelect(wrapper).props('createItem')).toBe(false)
  })
})

describe('AnimeForm change highlighting', () => {
  const savedAnime = {
    id: UUID(10),
    slug: 'cowboy-bebop',
    format: 'TV',
    status: 'FINISHED',
    translations: [
      {
        locale: 'en',
        title: 'Cowboy Bebop',
        description: 'Bounty hunters.',
        original: true,
      },
      { locale: 'ja', title: 'カウボーイビバップ', original: false },
    ],
    genres: [],
    relations: [],
  }

  async function mountEdit(overrides: Record<string, unknown> = {}) {
    const baseline = () =>
      buildAnimeFormState(
        savedAnime as Parameters<typeof buildAnimeFormState>[0],
      )
    const state = reactive(baseline())
    const fields = useFieldChanges({
      state,
      baseline,
      meta: ANIME_FIELD_META,
      enabled: () => true,
      expand: {
        translations: (next, base) => expandAnimeTranslationPaths(next, base),
      },
    })
    const wrapper = await mountSuspended(AnimeForm, {
      props: {
        state,
        'onUpdate:state': () => {},
        media,
        genres,
        isEdit: true,
        isDirty: true,
        saving: false,
        changes: fields.changes.value,
        relationRows: [],
        onSubmit: vi.fn(),
        onSearchAnime: async () => [],
        ...overrides,
      },
    })
    const sync = async () => {
      await wrapper.setProps({ changes: fields.changes.value })
      await nextTick()
    }
    return { wrapper, state, fields, sync }
  }

  const fieldAt = (
    wrapper: Awaited<ReturnType<typeof mountEdit>>['wrapper'],
    path: string,
  ) => wrapper.find(`[data-change][data-path="${path}"]`)

  it('does not highlight anything when the state matches the baseline', async () => {
    const { wrapper } = await mountEdit()
    expect(wrapper.findAll('[data-change="changed"]')).toHaveLength(0)
  })

  it('highlights the english title when it differs from the baseline', async () => {
    const { wrapper, state, fields, sync } = await mountEdit()
    expect(
      fieldAt(wrapper, 'translations.en.title').attributes('data-change'),
    ).toBe('unchanged')

    const en = state.translations.find((t) => t.locale === 'en')!
    en.title = 'Kauboi Bibappu'
    await sync()

    expect([...fields.changes.value.paths]).toContain('translations.en.title')
    expect(
      fieldAt(wrapper, 'translations.en.title').attributes('data-change'),
    ).toBe('changed')
    expect(fieldAt(wrapper, 'slug').attributes('data-change')).toBe('unchanged')
  })

  it('highlights a changed scalar field without touching its neighbours', async () => {
    const { wrapper, state, sync } = await mountEdit()
    state.slug = 'bebop'
    await sync()
    expect(fieldAt(wrapper, 'slug').attributes('data-change')).toBe('changed')
    expect(
      fieldAt(wrapper, 'translations.en.title').attributes('data-change'),
    ).toBe('unchanged')
  })

  it('keeps translation paths locale-keyed after a locale is removed', async () => {
    const { state, fields } = await mountEdit()
    state.translations = state.translations.filter((t) => t.locale !== 'ja')
    const en = state.translations.find((t) => t.locale === 'en')!
    en.title = 'Kauboi Bibappu'
    const paths = [...fields.changes.value.paths]
    expect(paths).toContain('translations.en.title')
    expect(paths.some((p) => p.startsWith('translations.ja.'))).toBe(false)
  })

  it('keeps paths a superset of the submitted top-level fields', async () => {
    const { state, fields } = await mountEdit()
    state.slug = 'bebop'
    const en = state.translations.find((t) => t.locale === 'en')!
    en.title = 'Kauboi Bibappu'
    const { topLevel, paths } = fields.changes.value
    for (const key of topLevel) expect(paths.has(key)).toBe(true)
    expect([...topLevel].sort()).toEqual(['slug', 'translations'])
  })

  it('treats clearing a value back to empty as unchanged', async () => {
    const { state, fields } = await mountEdit()
    const en = state.translations.find((t) => t.locale === 'en')!
    const original = en.title
    en.title = 'Something else'
    expect(fields.changes.value.isDirty).toBe(true)
    en.title = original
    expect(fields.changes.value.paths.has('translations.en.title')).toBe(false)
  })
})
