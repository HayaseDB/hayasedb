import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import RevisionTimeline from '../../app/components/contribution/RevisionTimeline.vue'
import {
  laneX,
  NODE_BOTTOM,
  NODE_TOP,
  NODE_Y,
  ROW_HEAD_HEIGHT,
  type RevisionGraphBranch,
  type RevisionGraphRevision,
} from '../../app/utils/revisionGraph'
import type { RevisionDiffSource } from '../../app/utils/contribution'
import { UUID } from '../contribution-fixtures'

const actor = (name: string | null = 'Alice') => ({
  id: UUID(9),
  name,
  image: null,
})

function revision(
  overrides: Partial<RevisionGraphRevision> = {},
): RevisionGraphRevision {
  return {
    id: UUID(overrides.rev ?? 1),
    rev: 1,
    op: 'update',
    changedFields: ['slug'],
    editor: actor(),
    changesetId: UUID(50),
    changesetSummary: 'Tidy the slug',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

function branch(
  overrides: Partial<RevisionGraphBranch> = {},
): RevisionGraphBranch {
  return {
    id: UUID(80),
    status: 'pending',
    summary: 'Add the 2026 season',
    author: actor('Mika'),
    changeCount: 2,
    baseRev: 2,
    submittedAt: '2026-08-02T10:00:00.000Z',
    createdAt: '2026-08-02T09:00:00.000Z',
    ...overrides,
  }
}

const diffSource = (): RevisionDiffSource => ({
  id: UUID(2),
  entityId: UUID(7),
  entityKind: 'anime',
  op: 'update',
  rev: 2,
  changedFields: ['slug'],
  snapshot: { slug: 'after' },
  previousSnapshot: { slug: 'before' },
})

const mount = (props: Record<string, unknown>) =>
  mountSuspended(RevisionTimeline, {
    props: { entityKind: 'anime', ...props },
  })

describe('RevisionTimeline', () => {
  it('renders the empty state when there is no history', async () => {
    const wrapper = await mount({ revisions: [] })
    expect(wrapper.text()).toContain('No revisions yet.')
  })

  it('renders open contributions above the applied trunk', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2 }), revision({ rev: 1, op: 'create' })],
      openChangesets: [branch()],
    })
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(3)
    expect(items[0]!.text()).toContain('Add the 2026 season')
    expect(items[1]!.text()).toContain('r2')
  })

  it('highlights a whole branch when its lane line is hovered', async () => {
    const wrapper = await mount({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    const hitFor = (lane: number) =>
      wrapper
        .findAll('line[stroke="transparent"]')
        .find((node) => Number(node.attributes('x1')) === laneX(lane))!

    const branchHit = hitFor(1)
    expect(branchHit).toBeTruthy()
    await branchHit.trigger('mouseenter')

    const lit = wrapper
      .findAll('line, path')
      .filter((node) => node.classes().includes('stroke-(--ui-primary)'))
    expect(lit.length).toBeGreaterThan(0)
    expect(wrapper.findAll('.opacity-30').length).toBeGreaterThan(0)

    await branchHit.trigger('mouseleave')
    expect(wrapper.findAll('.opacity-30')).toHaveLength(0)
  })

  it('lets a hovered lane win over the row it crosses', async () => {
    const wrapper = await mount({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    const row = wrapper.findAll('li')[1]!
    const branchHit = wrapper
      .findAll('line[stroke="transparent"]')
      .find((node) => Number(node.attributes('x1')) === laneX(1))!

    const litCount = () =>
      wrapper
        .findAll('line, path')
        .filter((node) => node.classes().includes('stroke-(--ui-primary)'))
        .length

    await branchHit.trigger('mouseenter')
    const litWhileOnLane = litCount()
    expect(litWhileOnLane).toBeGreaterThan(0)

    await row.trigger('mouseenter')
    expect(litCount()).toBe(litWhileOnLane)
  })

  it('offers a revert on past revisions but not on the head', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2 }), revision({ rev: 1, op: 'create' })],
      onRevert: () => undefined,
    })
    const labels = wrapper
      .findAll('button')
      .map((button) => button.attributes('aria-label'))
    expect(labels).toContain('Revert to revision 1')
    expect(labels).not.toContain('Revert to revision 2')
  })

  it('loads a revision diff once when a row is expanded', async () => {
    const onLoadRevision = vi.fn().mockResolvedValue(diffSource())
    const wrapper = await mount({
      revisions: [revision({ rev: 2 })],
      onLoadRevision,
    })

    const row = wrapper.find('[role="button"]')
    await row.trigger('click')
    await flushPromises()
    expect(onLoadRevision).toHaveBeenCalledTimes(1)
    expect(row.attributes('aria-expanded')).toBe('true')

    await row.trigger('click')
    await row.trigger('click')
    await flushPromises()
    expect(onLoadRevision).toHaveBeenCalledTimes(1)
  })

  it('reports a diff that could not be loaded', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2 })],
      onLoadRevision: () => Promise.reject(new Error('offline')),
    })
    await wrapper.find('[role="button"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('This revision could not be loaded.')
  })

  it("draws one rail SVG per row, centred on the row's own lane", async () => {
    const wrapper = await mount({
      revisions: [
        revision({ rev: 2, changesetId: null }),
        revision({ rev: 1, op: 'create', changesetId: null }),
      ],
    })
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)

    for (const item of items) {
      const dot = item.findAll('circle').at(-1)!
      expect(Number(dot.attributes('cx'))).toBe(laneX(0))
      expect(Number(dot.attributes('cy'))).toBe(NODE_Y)

      for (const rail of item.findAll('line')) {
        expect(rail.attributes('x1')).toBe(rail.attributes('x2'))
        expect(Number(rail.attributes('x1'))).toBe(laneX(0))
      }
    }

    expect(items[0]!.find('line').attributes('y1')).toBe(String(NODE_BOTTOM))
    expect(items[1]!.find('line').attributes('y2')).toBe(String(NODE_TOP))
  })

  it('starts an open contribution rail below its own dot, not above it', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2, changesetId: null })],
      openChangesets: [branch({ baseRev: 2 })],
    })
    const headSvg = wrapper.findAll('li')[0]!.findAll('svg')[0]!
    const ownLane = headSvg
      .findAll('line')
      .filter((rail) => Number(rail.attributes('x1')) === laneX(1))

    expect(ownLane.length).toBeGreaterThan(0)
    for (const rail of ownLane) {
      expect(Number(rail.attributes('y1'))).toBeGreaterThanOrEqual(NODE_BOTTOM)
    }
  })

  it('curves an open contribution back onto the trunk it forked from', async () => {
    const wrapper = await mount({
      revisions: [
        revision({ rev: 2, changesetId: null }),
        revision({ rev: 1, op: 'create', changesetId: null }),
      ],
      openChangesets: [branch({ baseRev: 2 })],
    })
    const items = wrapper.findAll('li')

    const branchDot = items[0]!.findAll('circle').at(-1)!
    expect(Number(branchDot.attributes('cx'))).toBe(laneX(1))

    const path = items[1]!.find('path')
    expect(path.exists()).toBe(true)
    expect(path.attributes('d')).toContain(`M${laneX(1)},0`)
    expect(path.attributes('d')).toContain(`${laneX(0)},${NODE_TOP}`)
    expect(path.attributes('fill')).toBe('none')
  })

  it('grows the rail taller rather than sideways when a diff opens', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2 }), revision({ rev: 1, op: 'create' })],
      onLoadRevision: () => Promise.resolve(diffSource()),
    })
    const row = wrapper.findAll('li')[0]!
    const lanesBefore = row.findAll('line').map((line) => line.attributes('x1'))

    await row.find('[role="button"]').trigger('click')
    await flushPromises()

    expect(row.findAll('line').map((line) => line.attributes('x1'))).toEqual(
      lanesBefore,
    )
    const tail = row.findAll('svg').at(1)!
    expect(tail.attributes('preserveAspectRatio')).toBe('none')
    expect(tail.attributes('height')).toBe('100%')
  })

  it('renders a single revision without any dangling rail', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 1, changesetId: null })],
    })
    const item = wrapper.find('li')
    expect(item.findAll('line')).toHaveLength(0)
    expect(item.findAll('path')).toHaveLength(0)
    expect(item.findAll('circle').length).toBeGreaterThan(0)
  })

  it('keeps every row on the same fixed rhythm', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 2 }), revision({ rev: 1, op: 'create' })],
      openChangesets: [branch()],
    })
    for (const item of wrapper.findAll('li')) {
      expect(item.attributes('style')).toContain(
        `min-height: ${ROW_HEAD_HEIGHT}px`,
      )
      expect(item.find('svg').attributes('height')).toBe(
        String(ROW_HEAD_HEIGHT),
      )
    }
  })

  it('says how much history is missing rather than ending the rail', async () => {
    const wrapper = await mount({
      revisions: [revision({ rev: 9 })],
      hasEarlier: true,
      earlierCount: 12,
    })
    expect(wrapper.text()).toContain('12 earlier revisions')
  })
})
