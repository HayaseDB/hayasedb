import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { provideChangeScope } from '#imports'
import AnimeEpisodeFields from '../../app/components/anime/AnimeEpisodeFields.vue'
import {
  newEpisodeDraft,
  type EpisodeDraft,
} from '../../app/utils/animeStructureForm'

const savedEpisode = (): EpisodeDraft => ({
  ...newEpisodeDraft(),
  isNew: false,
  baseRev: 1,
})

describe('AnimeEpisodeFields outside the form tree', () => {
  it('highlights a changed field from an explicitly passed scope', async () => {
    const episode = savedEpisode()
    const changes = {
      topLevel: new Set<string>(),
      paths: new Set([`episodes.${episode.id}.durationSeconds`]),
      isDirty: true,
    }

    const detached = defineComponent({
      setup() {
        return () => h(AnimeEpisodeFields, { episode, changes })
      },
    })

    const wrapper = await mountSuspended(detached)

    expect(
      wrapper.find('[data-path="durationSeconds"]').attributes('data-change'),
    ).toBe('changed')
  })

  it('still highlights when the scope is inherited from an ancestor', async () => {
    const episode = savedEpisode()
    const changes = {
      topLevel: new Set<string>(),
      paths: new Set([`episodes.${episode.id}.airDate`]),
      isDirty: true,
    }

    const nested = defineComponent({
      setup() {
        provideChangeScope({ changes })
        return () => h(AnimeEpisodeFields, { episode })
      },
    })

    const wrapper = await mountSuspended(nested)

    expect(
      wrapper.find('[data-path="airDate"]').attributes('data-change'),
    ).toBe('changed')
  })
})
