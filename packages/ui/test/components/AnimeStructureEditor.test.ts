import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AnimeStructureEditor from '../../app/components/anime/AnimeStructureEditor.vue'
import {
  emptyStructureState,
  newEpisodeDraft,
  newSeasonDraft,
  type AnimeStructureState,
} from '../../app/utils/animeStructureForm'

async function mount(initial: AnimeStructureState = emptyStructureState()) {
  const state = ref(initial)
  const wrapper = await mountSuspended(AnimeStructureEditor, {
    props: {
      state: state.value,
      'onUpdate:state': (next: AnimeStructureState) => {
        state.value = next
      },
    },
  })
  const button = (label: string) =>
    wrapper.findAll('button').find((el) => el.text() === label)
  return { wrapper, state, button }
}

const savedSeason = () => ({ ...newSeasonDraft(), isNew: false, baseRev: 1 })
const savedEpisode = () => ({ ...newEpisodeDraft(), isNew: false, baseRev: 1 })

describe('AnimeStructureEditor', () => {
  it('adds a season', async () => {
    const { state, button } = await mount()

    await button('Add season')!.trigger('click')

    expect(state.value.seasons).toHaveLength(1)
  })

  it('offers seasons or direct episodes, never both', async () => {
    const withSeason = emptyStructureState()
    withSeason.seasons.push(newSeasonDraft())
    const { button } = await mount(withSeason)

    expect(button('Add episode')).toBeUndefined()
    expect(button('Add season')).toBeDefined()
  })

  it('drops an unsaved season outright', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(newSeasonDraft())
    const { wrapper, state } = await mount(initial)

    await wrapper.find('[aria-label="Remove season"]').trigger('click')

    expect(state.value.seasons).toHaveLength(0)
  })

  it('tombstones a saved season so the changeset can delete it', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(savedSeason())
    const { wrapper, state } = await mount(initial)

    await wrapper.find('[aria-label="Remove season"]').trigger('click')

    expect(state.value.seasons).toHaveLength(1)
    expect(state.value.seasons[0]?.removed).toBe(true)
  })

  it('restores a tombstoned season', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(savedSeason())
    const { wrapper, state } = await mount(initial)

    await wrapper.find('[aria-label="Remove season"]').trigger('click')
    await wrapper.find('[aria-label="Restore season"]').trigger('click')

    expect(state.value.seasons[0]?.removed).toBe(false)
  })

  it('reorders seasons', async () => {
    const initial = emptyStructureState()
    const first = newSeasonDraft()
    const second = newSeasonDraft()
    initial.seasons.push(first, second)
    const { wrapper, state } = await mount(initial)

    const down = wrapper.findAll('[aria-label="Move season down"]')
    await down[0]!.trigger('click')

    expect(state.value.seasons.map((season) => season.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('restores a tombstoned direct episode', async () => {
    const initial = emptyStructureState()
    initial.episodes.push(savedEpisode())
    const { wrapper, state } = await mount(initial)

    await wrapper.find('[aria-label="Remove episode"]').trigger('click')
    expect(state.value.episodes[0]?.removed).toBe(true)

    await wrapper.find('[aria-label="Restore episode"]').trigger('click')
    expect(state.value.episodes[0]?.removed).toBe(false)
  })
})
