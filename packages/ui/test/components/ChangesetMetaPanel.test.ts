import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ChangesetMetaPanel from '../../app/components/contribution/ChangesetMetaPanel.vue'
import type { ChangesetDetail } from '@hayasedb/contract'
import type { Serialized } from '../../app/utils/serialized'
import { UUID } from '../contribution-fixtures'

function detail(
  overrides: Partial<Serialized<ChangesetDetail>> = {},
): Serialized<ChangesetDetail> {
  return {
    id: UUID(1),
    status: 'approved',
    summary: 'Add Bee',
    author: { id: null, name: null, image: null },
    decidedBy: { id: UUID(2), name: 'Mod', image: null },
    submittedAt: '2026-08-01T10:00:00.000Z',
    decidedAt: '2026-08-02T10:00:00.000Z',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
    supersedesId: null,
    supersededById: null,
    revertsId: null,
    revertedBy: null,
    changes: [],
    messages: [],
    display: { anime: {}, genre: {} },
    entityKinds: ['anime'],
    ...overrides,
  } as Serialized<ChangesetDetail>
}

describe('ChangesetMetaPanel', () => {
  it('accepts serialized dates and labels a deleted author', async () => {
    const wrapper = await mountSuspended(ChangesetMetaPanel, {
      props: { changeset: detail() },
    })
    const text = wrapper.text()
    expect(text).toContain('(deleted user)')
    expect(text).toContain('Mod')
    expect(text).toContain('Add Bee')
    expect(text).toContain(UUID(1))
    expect(wrapper.findAll('time').length).toBeGreaterThanOrEqual(2)
  })
})
