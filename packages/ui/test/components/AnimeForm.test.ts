import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AnimeForm from '../../app/components/anime/AnimeForm.vue'
import { buildAnimeFormState } from '../../app/utils/animeForm'
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
  wrapper.findComponent({ name: 'USelectMenu' })

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

  it('submits the schema-parsed payload with blank titles as null', async () => {
    const { wrapper, onSubmit } = await mount()
    await wrapper.find('#anime-slug').setValue('cowboy-bebop')
    await wrapper.find('#anime-titleEnglish').setValue('  Cowboy Bebop ')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0]![0]
    expect(payload).toMatchObject({
      slug: 'cowboy-bebop',
      titleEnglish: 'Cowboy Bebop',
      titleRomaji: null,
      titleNative: null,
      description: null,
      genreIds: [],
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
