import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import AnimeEpisodeFields from '../../app/components/anime/AnimeEpisodeFields.vue'
import AnimeSeasonFields from '../../app/components/anime/AnimeSeasonFields.vue'
import {
  newEpisodeDraft,
  newSeasonDraft,
} from '../../app/utils/animeStructureForm'

describe('structure drawers validate outside the anime form', () => {
  it('binds every episode field to the drawer form', async () => {
    const episode = newEpisodeDraft()
    const detached = defineComponent({
      setup: () => () => h(AnimeEpisodeFields, { episode }),
    })
    const wrapper = await mountSuspended(detached)

    expect(wrapper.find('form').exists()).toBe(true)
    const named = wrapper
      .findAll('[data-path]')
      .map((el) => el.attributes('data-path'))
    expect(named).toContain('durationSeconds')
  })

  it('reports an invalid episode runtime under the field', async () => {
    const episode = { ...newEpisodeDraft(), durationSeconds: -5 }
    const detached = defineComponent({
      setup: () => () => h(AnimeEpisodeFields, { episode }),
    })
    const wrapper = await mountSuspended(detached)

    await wrapper.find('form').trigger('submit')
    await new Promise((r) => setTimeout(r, 0))

    const field = wrapper.find('[data-path="durationSeconds"]')
    expect(field.text()).toMatch(/greater than 0|positive|Too small/i)
  })

  it('binds the season drawer to its own form', async () => {
    const season = newSeasonDraft()
    const detached = defineComponent({
      setup: () => () => h(AnimeSeasonFields, { season }),
    })
    const wrapper = await mountSuspended(detached)

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('[data-path="kind"]').exists()).toBe(true)
  })
})
