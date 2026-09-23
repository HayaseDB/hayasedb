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
      return () => h(AnimeEpisodeFields, { episode })
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
  it('highlights a changed field through the provided scope', async () => {
    const episode = savedEpisode()
    const wrapper = await mount(episode, [
      `episodes.${episode.id}.durationSeconds`,
    ])

    expect(
      wrapper.find('[data-path="durationSeconds"]').attributes('data-change'),
    ).toBe('changed')
  })

  it('does not mark optional fields', async () => {
    const wrapper = await mount(newEpisodeDraft())

    expect(wrapper.text()).toContain('Runtime (minutes)')
    expect(wrapper.text()).not.toContain('Optional')
  })
})
