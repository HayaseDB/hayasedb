import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import AnimeEpisodeRowEditor from '../../app/components/anime/AnimeEpisodeRowEditor.vue'
import {
  newEpisodeDraft,
  type EpisodeDraft,
} from '../../app/utils/animeStructureForm'

describe('row height stability', () => {
  it('keeps the same line structure with and without metadata', async () => {
    const bare = { ...newEpisodeDraft(), airDate: null, durationSeconds: null }
    const full = {
      ...newEpisodeDraft(),
      airDate: '2024-01-05',
      durationSeconds: 1440,
    }

    const mk = async (episode: EpisodeDraft) => {
      const c = defineComponent({
        setup: () => () => h(AnimeEpisodeRowEditor, { episode }),
      })
      return await mountSuspended(c)
    }
    const a = await mk(bare)
    const b = await mk(full)

    const lines = (w: Awaited<ReturnType<typeof mk>>) =>
      w.findAll('span.flex.min-w-0.flex-1.flex-col > span').length
    expect(lines(a)).toBe(lines(b))
    expect(lines(a)).toBe(2)
  })

  it('keeps the number chip free of the episode type', async () => {
    const recap: EpisodeDraft = {
      ...newEpisodeDraft(),
      type: 'RECAP',
      number: '3',
    }
    const c = defineComponent({
      setup: () => () => h(AnimeEpisodeRowEditor, { episode: recap }),
    })
    const wrapper = await mountSuspended(c)

    const chip = wrapper.find('span.tabular-nums')
    expect(chip.text()).toBe('3')
    expect(wrapper.text()).toContain('Recap')
    expect(wrapper.text().match(/Recap/g)).toHaveLength(1)
  })
})
