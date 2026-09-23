import type { ContributionDisplay } from '@hayasedb/contract'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ChangeGroupCard from '../../app/components/contribution/ChangeGroupCard.vue'
import { groupChanges } from '../../app/utils/contribution'
import { change, UUID } from '../contribution-fixtures'

const display: ContributionDisplay = {
  refs: { anime: { [UUID(3)]: 'Cowboy Bebop' } },
  parents: {
    [UUID(1)]: { animeId: UUID(3), seasonId: null, label: 'Season 1' },
    [UUID(2)]: { animeId: UUID(3), seasonId: UUID(5), label: 'Episode 3' },
  },
  contexts: {
    [UUID(3)]: {
      slug: 'cowboy-bebop',
      format: 'TV',
      status: 'RELEASED',
    },
  },
  mediaAssets: {},
}

const season = change({
  id: UUID(1),
  entityKind: 'animeSeason',
  entityId: UUID(5),
  oldValues: { number: '1' },
  payload: { number: '2' },
})

const episode = change({
  id: UUID(2),
  entityKind: 'animeEpisode',
  entityId: UUID(6),
  oldValues: { durationSeconds: 1440 },
  payload: { durationSeconds: 1500 },
})

describe('ChangeGroupCard', () => {
  it('titles each card by entity type and nests the episode inside its season', async () => {
    const [group] = groupChanges([season, episode], display)
    const wrapper = await mountSuspended(ChangeGroupCard, {
      props: { group: group! },
    })

    expect(wrapper.text()).toContain('Anime')

    const outer = wrapper.get(`#change-${UUID(1)}`)
    expect(outer.text()).toContain('Season')
    expect(outer.find(`#change-${UUID(2)}`).exists()).toBe(true)
  })

  it('shows the current anime fields when the anime itself was not edited', async () => {
    const [group] = groupChanges([season], display)
    const wrapper = await mountSuspended(ChangeGroupCard, {
      props: { group: group! },
    })

    expect(wrapper.text()).toContain('Slug')
    expect(wrapper.text()).toContain('cowboy-bebop')
    expect(wrapper.text()).not.toContain('No field changes')
  })

  it('renders a standalone episode beside the season, not inside it', async () => {
    const standalone = change({
      id: UUID(4),
      entityKind: 'animeEpisode',
      entityId: UUID(7),
      oldValues: { durationSeconds: 1440 },
      payload: { durationSeconds: 1600 },
    })
    const [group] = groupChanges([season, episode, standalone], {
      ...display,
      parents: {
        ...display.parents,
        [UUID(4)]: { animeId: UUID(3), seasonId: null, label: 'Episode 4' },
      },
    })
    const wrapper = await mountSuspended(ChangeGroupCard, {
      props: { group: group! },
    })

    const seasonSection = wrapper.get(`#change-${UUID(1)}`)
    expect(seasonSection.find(`#change-${UUID(2)}`).exists()).toBe(true)
    expect(seasonSection.find(`#change-${UUID(4)}`).exists()).toBe(false)
    expect(wrapper.find(`#change-${UUID(4)}`).exists()).toBe(true)
  })

  it('shows an edited season its own fields beside its diff', async () => {
    const [group] = groupChanges([season, episode], {
      ...display,
      contexts: {
        ...display.contexts,
        [UUID(5)]: { kind: 'SEASON', number: '1.000' },
      },
    })
    const wrapper = await mountSuspended(ChangeGroupCard, {
      props: { group: group! },
    })

    const outer = wrapper.get(`#change-${UUID(1)}`)
    expect(outer.text()).toContain('Current value')
    expect(outer.text()).toContain('Season')
    expect(outer.text()).not.toContain('1.000')
  })

  it('hides the parent link rows from a child diff', async () => {
    const [group] = groupChanges(
      [
        change({
          id: UUID(2),
          entityKind: 'animeEpisode',
          entityId: UUID(6),
          op: 'create',
          baseRev: null,
          payload: { animeId: UUID(3), number: '3', type: 'REGULAR' },
        }),
      ],
      display,
    )
    const wrapper = await mountSuspended(ChangeGroupCard, {
      props: { group: group! },
    })

    const rows = wrapper.findAll('[role="rowheader"]').map((row) => row.text())
    expect(rows).not.toContain('Anime')
    expect(rows).not.toContain('Season')
    expect(wrapper.text()).toContain('Number')
  })
})
