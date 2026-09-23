import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { provideChangeScope } from '#imports'
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

async function mountWithChanges(initial: AnimeStructureState, paths: string[]) {
  const changes = {
    topLevel: new Set<string>(),
    paths: new Set(paths),
    isDirty: paths.length > 0,
  }
  const parent = defineComponent({
    setup() {
      provideChangeScope({ changes })
      return () => h(AnimeStructureEditor, { state: initial })
    },
  })
  return await mountSuspended(parent)
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
    const { wrapper, button } = await mount(withSeason)

    expect(wrapper.find('[data-testid="add-direct-episode"]').exists()).toBe(
      false,
    )
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
  it('rings an unsaved season instead of badging it', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(newSeasonDraft())
    const { wrapper } = await mount(initial)

    expect(wrapper.find('[data-change="added"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('New')
  })

  it('rings a saved season whose field changed', async () => {
    const initial = emptyStructureState()
    const season = savedSeason()
    initial.seasons.push(season)
    const wrapper = await mountWithChanges(initial, [
      `seasons.${season.id}.number`,
    ])

    expect(wrapper.find('[data-change="changed"]').exists()).toBe(true)
  })

  it('reorders around a tombstoned season', async () => {
    const initial = emptyStructureState()
    const first = savedSeason()
    const middle = savedSeason()
    const last = savedSeason()
    initial.seasons.push(first, middle, last)
    const { wrapper, state } = await mount(initial)

    const remove = wrapper.findAll('[aria-label="Remove season"]')
    await remove[1]!.trigger('click')

    const down = wrapper.findAll('[aria-label="Move season down"]')
    await down[0]!.trigger('click')

    const visible = state.value.seasons.filter((season) => !season.removed)
    expect(visible.map((season) => season.id)).toEqual([last.id, first.id])
    expect(state.value.seasons).toHaveLength(3)
    expect(
      state.value.seasons.find((season) => season.id === middle.id)?.removed,
    ).toBe(true)
  })

  it('summarises a season by its episode count', async () => {
    const empty = emptyStructureState()
    empty.seasons.push(savedSeason())
    const { wrapper } = await mount(empty)

    expect(wrapper.text()).toContain('No episodes yet')

    const filled = emptyStructureState()
    const season = savedSeason()
    season.episodes.push(savedEpisode(), savedEpisode())
    filled.seasons.push(season)
    const second = await mount(filled)

    expect(second.wrapper.text()).toContain('2 episodes')
  })

  it('leaves the section heading to the page card', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(savedSeason())
    const { wrapper } = await mount(initial)

    expect(wrapper.text()).not.toContain('Episodes & seasons')
  })

  it('leaves an untouched saved season unringed', async () => {
    const initial = emptyStructureState()
    initial.seasons.push(savedSeason())
    const wrapper = await mountWithChanges(initial, [])

    expect(wrapper.find('[data-change="unchanged"]').exists()).toBe(true)
    expect(wrapper.find('[data-change="changed"]').exists()).toBe(false)
  })
})
