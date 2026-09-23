import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { provideChangeScope } from '#imports'
import AnimeEpisodeFields from '../../app/components/anime/AnimeEpisodeFields.vue'
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
      return () => h(AnimeEpisodeFields, { episode, label: 'Episode 1' })
    },
  })
  return await mountSuspended(parent)
}

const savedEpisode = (): EpisodeDraft => ({
  ...newEpisodeDraft(),
  isNew: false,
  baseRev: 1,
})

describe('AnimeEpisodeFields', () => {
  it('rings an unsaved episode instead of badging it', async () => {
    const wrapper = await mount(newEpisodeDraft())

    expect(wrapper.find('[data-change="added"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('New')
  })

  it('rings a saved episode whose field changed', async () => {
    const episode = savedEpisode()
    const wrapper = await mount(episode, [
      `episodes.${episode.id}.durationSeconds`,
    ])

    expect(wrapper.find('[data-change="changed"]').exists()).toBe(true)
  })

  it('leaves an untouched saved episode unringed', async () => {
    const wrapper = await mount(savedEpisode())

    expect(wrapper.find('[data-change="unchanged"]').exists()).toBe(true)
    expect(wrapper.find('[data-change="changed"]').exists()).toBe(false)
  })

  it('exposes one labelled disclosure trigger', async () => {
    const wrapper = await mount(savedEpisode())

    const triggers = wrapper.findAll('[aria-expanded]')

    expect(triggers).toHaveLength(1)
    expect(triggers[0]!.text()).toContain('Episode 1')
    expect(triggers[0]!.attributes('aria-expanded')).toBe('false')

    await triggers[0]!.trigger('click')

    expect(triggers[0]!.attributes('aria-expanded')).toBe('true')
    expect(triggers[0]!.attributes('aria-controls')).toBeTruthy()
  })

  it('does not mark optional fields', async () => {
    const wrapper = await mount(newEpisodeDraft())

    expect(wrapper.text()).toContain('Runtime (minutes)')
    expect(wrapper.text()).not.toContain('Optional')
  })
})
