import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AnimeRelationEditor from '../../app/components/anime/AnimeRelationEditor.vue'
import type { AnimeRelationEdgeItem } from '../../app/utils/animeForm'
import { UUID } from '../contribution-fixtures'

const edge = (
  n: number,
  kind: AnimeRelationEdgeItem['kind'],
): AnimeRelationEdgeItem => ({ animeId: UUID(n), title: `Anime ${n}`, kind })

async function mount(
  model: AnimeRelationEdgeItem[],
  baseline?: AnimeRelationEdgeItem[],
) {
  const value = ref(model)
  const wrapper = await mountSuspended(AnimeRelationEditor, {
    props: {
      modelValue: value.value,
      'onUpdate:modelValue': (next: AnimeRelationEdgeItem[]) => {
        value.value = next
      },
      selfId: UUID(99),
      baseline,
      searchAnime: async () => [],
    },
  })
  return { wrapper, value }
}

const rows = (wrapper: Awaited<ReturnType<typeof mount>>['wrapper']) =>
  wrapper.findAll('li').map((li) => ({
    title: li.find('[data-testid="relation-title"]').text(),
    kind: li.find('[aria-label="Relation kind"]').text(),
    removed: li.attributes('data-state') === 'removed',
    highlighted: ['added', 'changed'].includes(li.attributes('data-state')!),
  }))

describe('AnimeRelationEditor', () => {
  it('renders an empty state without a baseline', async () => {
    const { wrapper } = await mount([])
    expect(wrapper.text()).toContain('No relations yet.')
  })

  it('classifies rows against the baseline in baseline order', async () => {
    const { wrapper } = await mount(
      [edge(2, 'PREQUEL'), edge(3, 'SEQUEL'), edge(1, 'SEQUEL')],
      [edge(1, 'SEQUEL'), edge(2, 'SIDE_STORY'), edge(4, 'OTHER')],
    )
    expect(rows(wrapper)).toEqual([
      { title: 'Anime 1', kind: 'Sequel', removed: false, highlighted: false },
      { title: 'Anime 2', kind: 'Prequel', removed: false, highlighted: true },
      { title: 'Anime 4', kind: 'Other', removed: true, highlighted: false },
      { title: 'Anime 3', kind: 'Sequel', removed: false, highlighted: true },
    ])
  })

  it('removes an edge and restores a baseline edge through the model', async () => {
    const { wrapper, value } = await mount(
      [edge(1, 'SEQUEL')],
      [edge(1, 'SEQUEL'), edge(2, 'OTHER')],
    )
    await wrapper.find('[aria-label="Remove relation"]').trigger('click')
    expect(value.value).toEqual([])

    await wrapper.setProps({ modelValue: value.value })
    const restore = wrapper.findAll('[aria-label="Restore relation"]')
    expect(restore).toHaveLength(2)
    await restore[1]!.trigger('click')
    expect(value.value).toEqual([edge(2, 'OTHER')])
  })

  it('does not duplicate an edge on repeated restore', async () => {
    const { wrapper, value } = await mount(
      [edge(1, 'SEQUEL')],
      [edge(1, 'SEQUEL')],
    )
    await wrapper.setProps({ modelValue: [], baseline: [edge(1, 'SEQUEL')] })
    const restore = wrapper.find('[aria-label="Restore relation"]')
    await restore.trigger('click')
    await restore.trigger('click')
    expect(value.value).toEqual([edge(1, 'SEQUEL')])
  })
})
