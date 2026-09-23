import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { provideChangeScope } from '#imports'
import AnimeEpisodeRowEditor from '../../app/components/anime/AnimeEpisodeRowEditor.vue'
import {
  newEpisodeDraft,
  type EpisodeDraft,
} from '../../app/utils/animeStructureForm'

async function mount(episode: EpisodeDraft, paths: string[] = []) {
  const changes = {
    topLevel: new Set<string>(),
    paths: new Set(paths),
    isDirty: paths.length > 0,
  }
  const parent = defineComponent({
    setup() {
      provideChangeScope({ changes })
      return () => h(AnimeEpisodeRowEditor, { episode })
    },
  })
  return await mountSuspended(parent)
}

const savedEpisode = (): EpisodeDraft => ({
  ...newEpisodeDraft(),
  isNew: false,
  baseRev: 1,
})

describe('AnimeEpisodeRowEditor', () => {
  it('rings an unsaved episode instead of badging it', async () => {
    const wrapper = await mount(newEpisodeDraft())

    expect(wrapper.find('[data-change="added"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('New')
  })

  it('rings a changed episode while collapsed and counts the fields', async () => {
    const episode = savedEpisode()
    const wrapper = await mount(episode, [
      `episodes.${episode.id}.durationSeconds`,
      `episodes.${episode.id}.airDate`,
    ])

    expect(wrapper.find('[data-change="changed"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('2 changed')
  })

  it('leaves an untouched saved episode unringed', async () => {
    const wrapper = await mount(savedEpisode())

    expect(wrapper.find('[data-change="unchanged"]').exists()).toBe(true)
    expect(wrapper.find('[data-change="changed"]').exists()).toBe(false)
  })

  it('opens the editor from the row without a disclosure', async () => {
    const wrapper = await mount(savedEpisode())

    expect(
      wrapper.findAll('[aria-expanded]:not([aria-haspopup])'),
    ).toHaveLength(0)

    const row = wrapper.find('button')
    expect(row.element.tagName).toBe('BUTTON')

    await row.trigger('click')

    expect(
      wrapper.findComponent(AnimeEpisodeRowEditor).emitted('open'),
    ).toHaveLength(1)
  })

  it('does not emit open when reordering', async () => {
    const wrapper = await mount(savedEpisode())

    await wrapper.find('[aria-label="Move episode down"]').trigger('click')

    const row = wrapper.findComponent(AnimeEpisodeRowEditor)
    expect(row.emitted('moveDown')).toHaveLength(1)
    expect(row.emitted('open')).toBeUndefined()
  })
})
