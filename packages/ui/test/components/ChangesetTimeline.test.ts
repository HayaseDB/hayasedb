import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChangesetTimeline from '../../app/components/contribution/ChangesetTimeline.vue'
import type { TimelineChangeset } from '../../app/utils/contribution'
import { UUID } from '../contribution-fixtures'

const actor = (n: number, name: string | null = `User ${n}`) => ({
  id: UUID(n),
  name,
  image: null,
})

function changeset(
  overrides: Partial<TimelineChangeset> = {},
): TimelineChangeset {
  return {
    status: 'pending',
    author: actor(1),
    decidedBy: null,
    submittedAt: '2026-08-01T10:00:00.000Z',
    decidedAt: null,
    changeCount: 2,
    supersedesId: null,
    supersededById: null,
    revertsId: null,
    revertedBy: null,
    messages: [],
    ...overrides,
  }
}

async function mount(
  value: TimelineChangeset,
  onAdd: (body: string) => unknown = () => undefined,
) {
  return mountSuspended(ChangesetTimeline, {
    props: {
      changeset: value,
      placeholder: 'Write a comment',
      changesetPath: (id: string) => `/contributions/${id}`,
      onAdd,
    },
  })
}

describe('ChangesetTimeline', () => {
  it('renders the decision trail with author fallback and links', async () => {
    const wrapper = await mount(
      changeset({
        status: 'rejected',
        author: actor(1, null),
        decidedBy: actor(2, 'Mod'),
        decidedAt: '2026-08-02T10:00:00.000Z',
        supersedesId: UUID(7),
        messages: [
          {
            id: UUID(3),
            author: actor(2, 'Mod'),
            kind: 'rejection',
            body: 'Needs a source',
            createdAt: '2026-08-02T10:00:00.000Z',
          },
        ],
      }),
    )
    const text = wrapper.text()
    expect(text).toContain('(deleted user)')
    expect(text).toContain('submitted a revision')
    expect(text).toContain('View the earlier submission')
    expect(text).toContain('rejected this contribution')
    expect(text).toContain('Needs a source')
    expect(wrapper.find(`a[href="/contributions/${UUID(7)}"]`).exists()).toBe(
      true,
    )
  })

  it('submits a trimmed comment and clears the field on success', async () => {
    const onAdd = vi.fn(async () => true)
    const wrapper = await mount(changeset(), onAdd)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('  looks good  ')
    expect(wrapper.text()).toContain('characters left')
    await textarea.trigger('keydown.enter', { metaKey: true })
    await vi.waitFor(() => expect(onAdd).toHaveBeenCalledWith('looks good'))
    await vi.waitFor(() =>
      expect(
        (wrapper.find('textarea').element as HTMLTextAreaElement).value,
      ).toBe(''),
    )
  })

  it('keeps the draft when the handler reports failure and ignores blank drafts', async () => {
    const onAdd = vi.fn(async () => false)
    const wrapper = await mount(changeset(), onAdd)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('   ')
    await textarea.trigger('keydown.enter', { ctrlKey: true })
    expect(onAdd).not.toHaveBeenCalled()

    await textarea.setValue('keep me')
    await textarea.trigger('keydown.enter', { ctrlKey: true })
    await vi.waitFor(() => expect(onAdd).toHaveBeenCalledWith('keep me'))
    await flushPromises()
    await nextTick()
    expect(
      (wrapper.find('textarea').element as HTMLTextAreaElement).value,
    ).toBe('keep me')
  })

  it('does not submit on plain enter', async () => {
    const onAdd = vi.fn()
    const wrapper = await mount(changeset(), onAdd)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('draft')
    await textarea.trigger('keydown.enter')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
